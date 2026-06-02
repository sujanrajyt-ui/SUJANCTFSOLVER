const net = require('net');

module.exports = async (req, res) => {
  const json = JSON.stringify;
  function send(status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(json(data));
  }

  if (req.method !== 'POST') return send(405, { error: 'POST only' });

  const buffers = [];
  for await (const chunk of req) buffers.push(chunk);
  const raw = Buffer.concat(buffers).toString();
  let body;
  try { body = JSON.parse(raw); }
  catch { return send(400, { error: 'invalid JSON' }); }

  const host = (body.host || '').trim();
  const port = parseInt(body.port) || 0;
  const sendData = body.send || '';
  const timeout = Math.min(parseInt(body.timeout) || 20000, 25000);

  if (!host || !port) return send(400, { error: 'host and port required' });

  // Try connection with retry
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const data = await tryConnect(host, port, sendData, timeout);
      return send(200, { success: true, data: data, attempts: attempt + 1 });
    } catch (e) {
      if (attempt === 1) {
        return send(200, { success: false, data: '', error: e.message, attempts: 2 });
      }
      await new Promise(r => setTimeout(r, 1500));
    }
  }
};

function tryConnect(host, port, sendData, timeout) {
  return new Promise((resolve, reject) => {
    const sock = new net.Socket();
    let result = '';
    let ended = false;

    const done = (err) => {
      if (ended) return;
      ended = true;
      sock.destroy();
      if (err) return reject(err);
      resolve(result);
    };

    sock.setTimeout(timeout);
    sock.connect(port, host, () => {
      if (sendData) sock.write(sendData + '\n');
    });

    sock.on('data', chunk => {
      result += chunk.toString('utf8');
      if (result.length > 512000) done(new Error('response too large'));
    });

    sock.on('end', () => done(null));
    sock.on('error', e => done(e));
    sock.on('timeout', () => done(new Error('timeout after ' + timeout + 'ms')));
  });
}
