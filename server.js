const express = require('express');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const KALI_SERVER = process.env.KALI_SERVER || 'http://localhost:5000';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// Proxy to Kali CTF-Solver backend
const proxyHeaders = { 'Content-Type': 'application/json' };

app.post('/api/kali/:endpoint', async (req, res) => {
  try {
    const { endpoint } = req.params;
    const url = `${KALI_SERVER}/api/${endpoint}`;
    const response = await axios.post(url, req.body, {
      headers: proxyHeaders,
      timeout: 300000,
      validateStatus: () => true
    });
    res.json(response.data);
  } catch (err) {
    res.json({ error: err.message, success: false });
  }
});

app.get('/api/kali/health', async (req, res) => {
  try {
    const response = await axios.get(`${KALI_SERVER}/health`, { timeout: 5000 });
    res.json(response.data);
  } catch {
    res.json({ status: 'unavailable', error: 'Kali server not reachable' });
  }
});

app.post('/api/kali/command', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: 'command required' });
    exec(command, { timeout: 300000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      res.json({
        stdout: stdout || '',
        stderr: stderr || '',
        return_code: err ? (err.code || -1) : 0,
        success: !err,
        error: err ? err.message : null
      });
    });
  } catch (err) {
    res.json({ error: err.message, success: false });
  }
});

app.post('/api/local/exec', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: 'command required' });
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    exec(command, { timeout: 300000, maxBuffer: 10 * 1024 * 1024, shell }, (err, stdout, stderr) => {
      res.json({
        stdout: stdout || '',
        stderr: stderr || '',
        return_code: err ? (err.code || -1) : 0,
        success: !err
      });
    });
  } catch (err) {
    res.json({ error: err.message, success: false });
  }
});

// Alias for backward compat
app.post('/api/kali/exec', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: 'command required' });
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    exec(command, { timeout: 300000, maxBuffer: 10 * 1024 * 1024, shell }, (err, stdout, stderr) => {
      res.json({
        stdout: stdout || '',
        stderr: stderr || '',
        return_code: err ? (err.code || -1) : 0,
        success: !err
      });
    });
  } catch (err) {
    res.json({ error: err.message, success: false });
  }
});

app.listen(PORT, () => {
  console.log(`\x1b[36m`);
  console.log(`  ╔══════════════════════════════════════╗`);
  console.log(`  ║        SUJANSCTFSOLVER v1.0          ║`);
  console.log(`  ║     AI-Powered CTF Solving Platform  ║`);
  console.log(`  ╠══════════════════════════════════════╣`);
  console.log(`  ║  Server: http://localhost:${String(PORT).padEnd(5)}          ║`);
  console.log(`  ║  Kali:   ${KALI_SERVER.padEnd(30)}║`);
  console.log(`  ╚══════════════════════════════════════╝`);
  console.log(`\x1b[0m`);
});
