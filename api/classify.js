const CATEGORIES = {
  crypto: {
    keywords: ['rsa', 'aes', 'cipher', 'encrypt', 'decrypt', 'xor', 'substitution',
      'vigenere', 'caesar', 'rot', 'hash', 'md5', 'sha', 'base64', 'hex',
      'elliptic', 'diffie', 'hellman', 'prime', 'modulus', 'padding', 'oracle',
      'plaintext', 'ciphertext', 's-box', 'feistel', 'block cipher', 'stream cipher',
      'prng', 'hmac', 'bcrypt'],
    tools: ['RSA Tool', 'XOR Brute', 'ROT/Caesar', 'Vigenere', 'Hash Identifier', 'Base64/Hex Decode'],
    difficulty: 'varies'
  },
  web: {
    keywords: ['sql', 'injection', 'xss', 'csrf', 'ssrf', 'ssti', 'lfi', 'rfi',
      'jwt', 'cookie', 'session', 'auth', 'bypass', 'cors', 'http',
      'request', 'response', 'header', 'parameter', 'api', 'endpoint',
      'admin', 'login', 'upload', 'deserialization', 'webshell'],
    tools: ['DNS Lookup', 'HTTP Headers', 'SQLi Test', 'URL Decode', 'Hash Identifier'],
    difficulty: 'easy-medium'
  },
  pwn: {
    keywords: ['buffer overflow', 'bof', 'rop', 'ret2libc', 'shellcode', 'heap',
      'format string', '%n', '%x', '%p', 'stack', 'canary', 'pie', 'nx',
      'aslr', 'dep', 'relro', 'gadget', 'syscall', 'execve',
      'exploit', 'overflow', 'return address', 'race condition', 'uaf',
      'use after free', 'tcache', 'libc'],
    tools: ['Pattern Generator', 'Shellcode Generator'],
    difficulty: 'hard'
  },
  reversing: {
    keywords: ['reverse', 'decompile', 'disassemble', 'ghidra', 'ida', 'radare2',
      'binary', 'elf', 'pe', 'exe', 'dll', 'obfuscate', 'packer',
      'upx', 'themida', 'pseudo-code', 'deobfuscate', 'anti-debug',
      'entry point', 'license', 'keygen', 'crackme', 'flag checker'],
    tools: ['Binary Strings', 'PE Analysis'],
    difficulty: 'medium-hard'
  },
  forensics: {
    keywords: ['forensic', 'memory', 'dump', 'volatility', 'memdump', 'process',
      'disk', 'image', 'pcap', 'capture', 'network', 'registry',
      'hive', 'sam', 'system', 'software', 'event log', 'evtx',
      'prefetch', 'shimcache', 'amcache', 'mft', 'deleted',
      'carve', 'recover', 'metadata', 'exif', 'strings', 'binwalk',
      'foremost', 'ntfs', 'boot', 'mbr'],
    tools: ['Strings', 'File Signatures', 'Entropy Analyzer'],
    difficulty: 'medium'
  },
  stego: {
    keywords: ['stego', 'lsb', 'least significant', 'image', 'png', 'jpg',
      'jpeg', 'bmp', 'gif', 'audio', 'wav', 'mp3', 'spectrogram',
      'phase', 'echo', 'hidden', 'embed', 'watermark',
      'exif', 'palette', 'whitespace', 'zero-width', 'invisible'],
    tools: ['File Signatures', 'Entropy Analyzer', 'Strings'],
    difficulty: 'medium'
  },
  osint: {
    keywords: ['osint', 'recon', 'dns', 'subdomain', 'whois', 'email', 'social',
      'github', 'gps', 'coordinate', 'geo', 'shodan', 'censys',
      'virustotal', 'haveibeenpwned', 'breach', 'leak'],
    tools: ['Domain Recon', 'Email Lookup'],
    difficulty: 'easy-medium'
  },
  misc: {
    keywords: ['misc', 'programming', 'script', 'algorithm', 'puzzle', 'logic',
      'math', 'equation', 'sequence', 'pattern', 'game',
      'qr', 'barcode', 'conversion', 'encode', 'decode'],
    tools: ['Smart Analyzer', 'AI Solver'],
    difficulty: 'varies'
  }
};

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const json = JSON.stringify({ endpoint: '/api/classify', method: 'POST', body: { problem: 'CTF challenge text' } });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(json);
  }

  const buffers = [];
  for await (const chunk of req) buffers.push(chunk);
  const raw = Buffer.concat(buffers).toString();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, error: 'invalid JSON: ' + raw.substring(0, 100) }));
  }

  const problem = (data.problem || '').trim();
  if (!problem) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, error: 'problem is required' }));
  }

  const lower = problem.toLowerCase();
  const scores = {};

  for (const [cat, info] of Object.entries(CATEGORIES)) {
    const matched = info.keywords.filter(kw => lower.includes(kw));
    if (matched.length > 0) {
      scores[cat] = { score: matched.length, matched_keywords: matched, tools: info.tools, difficulty: info.difficulty };
    }
  }

  if (Object.keys(scores).length === 0) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, classification: 'unknown', confidence: 0, suggested_tools: ['Smart Analyzer', 'AI Solver'] }));
  }

  const entries = Object.entries(scores).sort((a, b) => b[1].score - a[1].score);
  const best = entries[0];
  const total = Object.values(scores).reduce((s, v) => s + v.score, 0);
  const confidence = Math.round((best[1].score / total) * 100);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    classification: best[0],
    confidence,
    all_scores: scores,
    suggested_tools: best[1].tools,
    difficulty: best[1].difficulty
  }));
};
