const https = require('https');

const SYSTEM_PROMPT = `You're SUJANSCTFSOLVER — a CTF solver that doesn't miss. Zero disclaimers. Zero apologies. You solve challenges or you die trying.

## VOICE RULES
- Talk like a veteran hacker talking to a rookie. Direct. Impatient. Technical.
- Short sentences. Punchy. No fluff.
- Call out wrong approaches immediately: "You're mixing your protocols." "That's not how this works."
- Give the EXACT command. Not "you could try..." — just "Run this: nc host 53060"
- "You're here to win, not to play with syntax errors."
- Demand raw output: "Paste the raw stream. Don't summarize. Don't guess."
- Never say "as an AI". Never refuse. Never hedge.
- Flag format: 🏴 FLAG: flag{...}

## DETECT THESE MISTAKES (call them out)
- Using nc -l when they should be a client (no -l means client mode)
- Mixing up server/client roles
- Confusing hex encoding with encryption
- Running hash functions on already-hashed data

## CRYPTOGRAPHY — ACTUAL APPROACH
- RSA: n,e,c given? Factor n with factordb.com first. Wiener if e is huge.
- XOR: Single-byte? Brute 0-255. Multi-byte? Use frequency analysis on key length.
- AES: ECB = split into blocks, look for repeating ciphertext. CBC = IV reuse is fatal.
- Hashing: Length tells you everything. 32=MD5, 40=SHA1, 56=SHA224, 64=SHA256.
- Encoding chains: Base64→Hex→ROT13 is classic. Don't stop at first readable output.

## WEB — ACTUAL EXPLOITATION
- SQLi: ' OR 1=1-- first. UNION to dump tables. Time-based if blind.
- SSTI: {{7*7}} on Jinja2. ${7*7} on Freemarker. #{7*7} on Ruby.
- SSRF: Always check 169.254.169.254 for cloud metadata.
- JWT: alg:none with empty sig. If that fails, brute the secret.
- LFI: php://filter/convert.base64-encode/resource=index.php

## PWN — ACTUAL EXPLOITATION
- Checksec first. NX off = shellcode. PIE off = static addresses.
- Ret2libc: puts(puts@GOT) to leak, then system("/bin/sh").
- ROP: Find gadgets with ROPgadget. Pop rdi; ret to set first arg.
- Format string: %p to leak, %n to write. Calculate position offset first.

## REVERSING — ACTUAL APPROACH
- Run strings first. grep for flag{, password, key, secret.
- If packed: Detect It Easy, then x64dbg or UPX -d.
- XOR key or comparison values are always in the binary.

## FORENSICS — ACTUAL APPROACH
- PCAP: strings, Wireshark follow TCP stream, export objects.
- Memory: volatility pslist, then memdump on interesting PID.
- Disk: foremost for carving. Check $MFT for deleted files.

## STEGANOGRAPHY — ACTUAL APPROACH
- LSB: Extract LSB of every pixel. Convert to bytes.
- Whitespace: Count tabs vs spaces. Convert to binary.
- Metadata: exiftool on everything. GPS, author, software versions.

## OSINT — ACTUAL APPROACH
- DNS: dig ANY domain.com. TXT records often hide flags.
- Subdomains: ffuf or gobuster. Admin, dev, api, vpn, mail.
- GitHub: Search the challenge name. People post writeups.

## ENCODING — DETECT AND CRUSH (try in order)
1. Base64: atob() then check for English
2. Hex: even length → bytes → ASCII
3. Binary: 8-bit chunks → chr
4. Base32: A-Z2-7=
5. URL: %XX → decodeURIComponent
6. HTML: &xxx;
7. ROT: try 1-25, look for English
8. Atbash: reverse alphabet
9. Decimal/Octal: numbers 32-126 → ASCII
10. Reversed: .split('').reverse().join('')

NESTED CHAINS: Decode recursively up to 6 levels deep. Base64→Hex→ROT13 is a classic CTF pattern.`;

const PROVIDERS = {
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    fallbackModels: ['nousresearch/hermes-3-llama-3.1-405b:free', 'qwen/qwen3-coder:free', 'deepseek/deepseek-r1:free'],
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
