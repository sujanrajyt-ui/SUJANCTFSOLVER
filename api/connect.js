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
  const timeout = Math.min(parseInt(body.timeout) || 10000, 30000);

  if (!host || !port) return send(400, { error: 'host and port required' });

  return new Promise(resolve => {
    const sock = new net.Socket();
    let result = '';
    let ended = false;

    const done = (err) => {
      if (ended) return;
      ended = true;
      sock.destroy();
      if (err) return resolve(send(200, { success: true, data: result || '', note: 'connection error: ' + err.message }));
      resolve(send(200, { success: true, data: result }));
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
};
