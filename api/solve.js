const https = require('https');

const SYSTEM_PROMPT = `You are SUJANSCTFSOLVER — an elite AI CTF solver with 95%+ success rate. Solve CTF challenges with step-by-step reasoning. When you find the flag, highlight it as: FLAG: flag{...}

## CRYPTOGRAPHY
- RSA: Extract n,e,c. Try small n factoring, Wiener if e is large, common modulus, broadcast, Hastad's, Fermat
- AES: Identify mode (ECB/CBC/CTR). Check for key reuse, IV reuse, padding oracle
- XOR: Try single-byte brute (0-255), multi-byte with key-length detection, crib dragging
- Classical: Frequency analysis for substitution, index of coincidence for Vigenere
- Hash: Identify by length (MD5=32, SHA1=40, SHA256=64, SHA512=128)

## WEB EXPLOITATION
- SQLi: Check for ' OR 1=1--, UNION, time-based, boolean-based, error-based
- XSS: Test <script>, img onerror, svg, polyglots, CSP bypass
- SSTI: Test {{7*7}}, {7*7}, #{7*7}, ${7*7}
- LFI: Test ../../../etc/passwd, php://filter wrappers
- SSRF: Test internal IPs, cloud metadata (169.254.169.254)
- JWT: Check alg:none, weak secret brute, kid injection

## BINARY EXPLOITATION (PWN)
- Checksec: Identify protections (NX, PIE, RELRO, Stack Canary)
- ROP: Find gadgets, build chain with pop rdi; ret
- Ret2libc: Leak libc via puts/GOT, compute system+"/bin/sh"
- Heap: Tcache poisoning, fastbin attack, use-after-free
- Format string: Use %p to leak, %n to write, calculate offsets

## REVERSE ENGINEERING
- Static: Analyze strings, imports, sections. Look for base64 tables, XOR keys
- Dynamic: Trace execution, hook functions, patch jumps
- Obfuscation: Look for opaque predicates, control flow flattening

## FORENSICS
- Memory: Extract processes with pslist, dump with memdump
- Disk: Check for deleted files, alternate data streams, $MFT
- Network: Extract PCAP objects, follow TCP streams
- Registry: Check RUN keys, UserAssist, ShimCache, AmCache

## STEGANOGRAPHY
- Image: Check LSB, palette, metadata (EXIF), embedded ZIP
- Audio: Check spectrogram, phase encoding, echo hiding, LSB in WAV
- Text: Check whitespace (tabs vs spaces), zero-width characters

## OSINT
- DNS: Check A, AAAA, MX, TXT, CNAME, NS, SOA records
- Subdomains: Try common prefixes (admin, dev, api, mail)
- Social: Check social media, GitHub repos, Pastebin, Shodan

ALWAYS show step-by-step reasoning. Output the flag as FLAG: flag{...} when found.`;

const PROVIDERS = {
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    fallbackModels: ['liquid/lfm-2.5-1.2b-thinking:free', 'deepseek/deepseek-v4-flash:free', 'nousresearch/hermes-3-llama-3.1-405b:free', 'qwen/qwen3-coder:free'],
    envKey: 'OPENROUTER_API_KEY',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': 'https://sujanctfsolver.vercel.app',
      'X-Title': 'SUJANSCTFSOLVER'
    })
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    envKey: 'GROQ_API_KEY',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    })
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.0-flash',
    envKey: 'GEMINI_API_KEY',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    envKey: 'OPENAI_API_KEY',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    })
  }
};

function sendJSON(res, status, data) {
  const json = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(json);
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return sendJSON(res, 200, {
      endpoint: '/api/solve',
      method: 'POST',
      body: { problem: 'CTF challenge', provider: 'openrouter|groq|gemini|openai', model: 'optional' }
    });
  }

  // Read body using async iterator
  const buffers = [];
  for await (const chunk of req) buffers.push(chunk);
  const raw = Buffer.concat(buffers).toString();
  let data;
  try { data = JSON.parse(raw); }
  catch { return sendJSON(res, 400, { success: false, error: 'invalid JSON' }); }

  const problem = (data.problem || '').trim();
  const providerName = (data.provider || 'openrouter').trim().toLowerCase();
  const modelOverride = (data.model || '').trim();

  if (!problem) return sendJSON(res, 400, { success: false, error: 'problem is required' });

  const config = PROVIDERS[providerName];
  if (!config) return sendJSON(res, 400, { success: false, error: `unknown provider: ${providerName}` });

  const apiKey = process.env[config.envKey];
  if (!apiKey) return sendJSON(res, 501, { success: false, error: `${config.envKey} not configured on server` });

  const modelsToTry = [];
  if (modelOverride) {
    modelsToTry.push(modelOverride);
  } else {
    modelsToTry.push(config.defaultModel);
    if (config.fallbackModels) modelsToTry.push(...config.fallbackModels);
  }

  let lastError = null;
  for (const model of modelsToTry) {
    try {
      let result;
      if (providerName === 'gemini') {
        result = await callGemini(apiKey, config, model, problem);
      } else {
        result = await callChat(apiKey, config, model, problem, providerName);
      }
      if (result.success) {
        return sendJSON(res, 200, result);
      }
      lastError = result.error;
    } catch (e) {
      lastError = e.message;
    }
  }

  sendJSON(res, 500, { success: false, error: lastError || 'All models failed' });
};

function callChat(apiKey, config, model, problem, providerName) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: problem }
      ],
      max_tokens: 8192,
      temperature: 0.2
    });

    const url = new URL(`${config.baseUrl}/chat/completions`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: config.headers(apiKey),
      timeout: 120000
    };

    const r = https.request(options, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (resp.statusCode !== 200) {
            const err = parsed.error || {};
            return resolve({ success: false, error: `[${resp.statusCode}] ${err.message || err.code || JSON.stringify(parsed).substring(0,200)}` });
          }
          const content = (parsed.choices || [{}])[0]?.message?.content || '';
          resolve({ success: true, content, provider: providerName, model });
        } catch (e) {
          resolve({ success: false, error: `Parse error: ${e.message}. Raw: ${data.substring(0,100)}` });
        }
      });
    });

    r.on('error', reject);
    r.on('timeout', () => { r.destroy(); reject(new Error('Request timeout after 120s')); });
    r.write(body);
    r.end();
  });
}

function callGemini(apiKey, config, model, problem, providerName) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{
        parts: [{ text: `${SYSTEM_PROMPT}\n\n--- PROBLEM ---\n\n${problem}\n\n--- SOLUTION ---` }]
      }],
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
      ],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.2 }
    });

    const url = new URL(`${config.baseUrl}/models/${model}:generateContent?key=${apiKey}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeout: 90000
    };

    const r = https.request(options, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (resp.statusCode !== 200) {
            const err = parsed.error || {};
            return resolve({ success: false, error: err.message || JSON.stringify(parsed) });
          }
          const parts = (parsed.candidates || [{}])[0]?.content?.parts || [];
          const content = parts[0]?.text || '';
          if (!content) {
            const reason = (parsed.candidates || [{}])[0]?.finishReason || 'unknown';
            return resolve({ success: false, error: `No response (reason: ${reason})` });
          }
          resolve({ success: true, content, provider: 'gemini', model });
        } catch (e) {
          resolve({ success: false, error: `Parse error: ${e.message}` });
        }
      });
    });

    r.on('error', reject);
    r.on('timeout', () => { r.destroy(); reject(new Error('Gemini timeout after 90s')); });
    r.write(body);
    r.end();
  });
}
