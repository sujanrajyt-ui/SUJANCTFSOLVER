const https = require('https');
const http = require('http');
const { URL } = require('url');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ endpoint: '/api/webfetch', method: 'POST', body: { url: 'https://target.com', method: 'GET|POST', headers: {}, body: '', timeout: 15000 } }));
    return;
  }

  const buffers = [];
  for await (const chunk of req) buffers.push(chunk);
  let data;
  try { data = JSON.parse(Buffer.concat(buffers).toString()); }
  catch { return sendJSON(res, 400, { success: false, error: 'invalid JSON' }); }

  const targetUrl = (data.url || '').trim();
  if (!targetUrl) return sendJSON(res, 400, { success: false, error: 'url is required' });

  const method = (data.method || 'GET').toUpperCase();
  const headers = data.headers || {};
  const body = data.body || '';
  const timeout = Math.min(parseInt(data.timeout) || 15000, 25000);

  let parsedUrl;
  try { parsedUrl = new URL(targetUrl); }
  catch { return sendJSON(res, 400, { success: false, error: 'invalid URL' }); }

  const lib = parsedUrl.protocol === 'https:' ? https : http;
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method,
    headers: { 'User-Agent': 'Mozilla/5.0 (SUJANSCTFSOLVER)', ...headers },
    timeout
  };

  const startTime = Date.now();
  const request = lib.request(options, (response) => {
    let responseData = '';
    let truncated = false;
    response.on('data', chunk => {
      responseData += chunk.toString('utf8');
      if (responseData.length > 1024000) {
        responseData = responseData.substring(0, 1024000);
        truncated = true;
        response.destroy();
      }
    });
    response.on('end', () => {
      sendJSON(res, 200, { success: true, status: response.statusCode, headers: response.headers, body: responseData, truncated, time: Date.now() - startTime });
    });
    response.on('close', () => {
      if (responseData) sendJSON(res, 200, { success: true, status: response.statusCode, headers: response.headers, body: responseData, truncated, time: Date.now() - startTime });
    });
  });

  request.on('error', e => sendJSON(res, 500, { success: false, error: e.message }));
  request.on('timeout', () => { request.destroy(); sendJSON(res, 504, { success: false, error: 'request timeout' }); });

  if (method !== 'GET' && method !== 'HEAD' && body) {
    request.write(body);
  }
  request.end();
};

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}
