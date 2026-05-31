const CATEGORIES = {
  crypto: {
    keywords: ['rsa', 'aes', 'des', 'cipher', 'encrypt', 'decrypt', 'xor', 'substitution',
      'vigenere', 'caesar', 'rot', 'hash', 'md5', 'sha', 'base64', 'hex',
      'elliptic', 'diffie', 'hellman', 'prime', 'modulus', 'padding', 'oracle',
      'plaintext', 'ciphertext', 's-box', 'feistel', 'block cipher', 'stream cipher',
      'prng', 'random', 'signature', 'hmac', 'bcrypt', 'key'],
    tools: ['RSA Tool', 'XOR Brute', 'ROT/Caesar', 'Vigenere', 'Hash Identifier', 'Base64/Hex Decode'],
    difficulty: 'varies'
  },
  web: {
    keywords: ['sql', 'injection', 'xss', 'csrf', 'ssrf', 'ssti', 'lfi', 'rfi',
      'jwt', 'cookie', 'session', 'auth', 'bypass', 'cors', 'http',
      'request', 'response', 'header', 'parameter', 'get', 'post',
      'api', 'endpoint', 'admin', 'login', 'register', 'upload',
      'file inclusion', 'command injection', 'template', 'deserialization',
      'sqli', 'blind', 'webshell'],
    tools: ['DNS Lookup', 'HTTP Headers', 'SQLi Test', 'URL Decode', 'Hash Identifier'],
    difficulty: 'easy-medium'
  },
  pwn: {
    keywords: ['buffer overflow', 'bof', 'rop', 'ret2libc', 'shellcode', 'heap',
      'format string', '%n', '%x', '%p', 'stack', 'canary', 'pie', 'nx',
      'aslr', 'dep', 'relro', 'gadget', 'syscall', 'execve', '/bin/sh',
      'exploit', 'overflow', 'return address', 'eip', 'rip', 'segfault',
      'race condition', 'uaf', 'use after free', 'tcache', 'fastbin',
      'arbitrary write', 'arbitrary read', 'leak', 'libc'],
    tools: ['Pattern Generator', 'Shellcode Generator'],
    difficulty: 'hard'
  },
  reversing: {
    keywords: ['reverse', 'decompile', 'disassemble', 'ghidra', 'ida', 'radare2',
      'binary', 'elf', 'pe', 'exe', 'dll', 'obfuscate', 'packer',
      'upx', 'themida', 'vmp', 'arm', 'x86', 'x64',
      'pseudo-code', 'deobfuscate', 'anti-debug', 'anti-vm',
      'entry point', 'oep', 'tls', 'callback', 'license', 'keygen',
      'crackme', 'flag checker', 'validation'],
    tools: ['Binary Strings', 'PE Analysis'],
    difficulty: 'medium-hard'
  },
  forensics: {
    keywords: ['forensic', 'memory', 'dump', 'volatility', 'memdump', 'process',
      'disk', 'image', 'dd', 'raw', 'pcap', 'capture', 'network',
      'registry', 'hive', 'ntuser', 'sam', 'system', 'software',
      'event log', 'evtx', 'prefetch', 'shimcache', 'amcache',
      'usnjrnl', 'mft', 'deleted', 'carve', 'recover',
      'metadata', 'exif', 'strings', 'binwalk', 'foremost',
      'ntfs', 'fat', 'ext', 'partition', 'boot', 'mbr', 'gpt'],
    tools: ['Strings', 'File Signatures', 'Entropy Analyzer'],
    difficulty: 'medium'
  },
  stego: {
    keywords: ['stego', 'lsb', 'least significant', 'bit', 'image', 'png', 'jpg',
      'jpeg', 'bmp', 'gif', 'audio', 'wav', 'mp3', 'spectrogram',
      'phase', 'echo', 'hidden', 'embed', 'watermark',
      'exif', 'palette', 'pixel', 'color', 'channel', 'alpha',
      'whitespace', 'zero-width', 'unicode', 'invisible'],
    tools: ['File Signatures', 'Entropy Analyzer', 'Strings'],
    difficulty: 'medium'
  },
  osint: {
    keywords: ['osint', 'recon', 'dns', 'subdomain', 'whois', 'email', 'social',
      'github', 'twitter', 'facebook', 'instagram', 'linkedin',
      'phone', 'username', 'profile', 'search', 'find', 'locate',
      'gps', 'coordinate', 'geo', 'map', 'satellite',
      'shodan', 'censys', 'virustotal', 'haveibeenpwned',
      'breach', 'leak', 'password', 'credential', 'dump'],
    tools: ['Domain Recon', 'Email Lookup'],
    difficulty: 'easy-medium'
  },
  misc: {
    keywords: ['misc', 'programming', 'script', 'algorithm', 'puzzle', 'logic',
      'math', 'equation', 'number', 'sequence', 'pattern', 'game',
      'qr', 'barcode', 'color',
      'conversion', 'encode', 'decode', 'base', 'radix', 'transformation'],
    tools: ['Smart Analyzer', 'AI Solver'],
    difficulty: 'varies'
  }
};

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return res.json({
      endpoint: '/api/classify',
      method: 'POST',
      body: { problem: 'CTF challenge text' }
    });
  }

  const { problem } = req.body || {};
  if (!problem) return res.status(400).json({ success: false, error: 'problem is required' });

  const lower = problem.toLowerCase();
  const scores = {};

  for (const [cat, info] of Object.entries(CATEGORIES)) {
    const matched = info.keywords.filter(kw => lower.includes(kw));
    if (matched.length > 0) {
      scores[cat] = { score: matched.length, matched_keywords: matched, tools: info.tools, difficulty: info.difficulty };
    }
  }

  if (Object.keys(scores).length === 0) {
    return res.json({
      success: true,
      classification: 'unknown',
      confidence: 0,
      suggested_tools: ['Smart Analyzer', 'AI Solver']
    });
  }

  const best = Object.entries(scores).sort((a, b) => b[1].score - a[1].score)[0];
  const total = Object.values(scores).reduce((s, v) => s + v.score, 0);
  const confidence = Math.round((best[1].score / total) * 100);

  res.json({
    success: true,
    classification: best[0],
    confidence,
    all_scores: scores,
    suggested_tools: best[1].tools,
    difficulty: best[1].difficulty
  });
};
