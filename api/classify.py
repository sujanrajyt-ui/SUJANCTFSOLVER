from flask import Flask, request, jsonify
import re

app = Flask(__name__)

CATEGORIES = {
    'crypto': {
        'keywords': ['rsa', 'aes', 'des', 'cipher', 'encrypt', 'decrypt', 'xor', 'substitution',
                     'vigenere', 'caesar', 'rot', 'hash', 'md5', 'sha', 'base64', 'hex',
                     'elliptic', 'diffie', 'hellman', 'prime', 'modulus', 'padding', 'oracle',
                     'plaintext', 'ciphertext', 'key', 's盒', 's-box', 'feistel', 'block cipher',
                     'stream cipher', 'prng', 'random number', 'signature', 'hmac', 'bcrypt'],
        'tools': ['RSA Tool', 'XOR Brute', 'ROT/Caesar', 'Vigenere', 'Hash Identifier', 'Base64/Hex Decode'],
        'difficulty': 'varies',
    },
    'web': {
        'keywords': ['sql', 'injection', 'xss', 'csrf', 'ssrf', 'ssti', 'lfi', 'rfi',
                     'jwt', 'cookie', 'session', 'auth', 'bypass', 'cors', 'http',
                     'request', 'response', 'header', 'parameter', 'get', 'post',
                     'api', 'endpoint', 'admin', 'login', 'register', 'upload',
                     'file inclusion', 'command injection', 'template', 'deserialization',
                     'sqli', 'blind', 'time-based', 'boolean', 'union', 'webshell'],
        'tools': ['DNS Lookup', 'HTTP Headers', 'SQLi Test', 'URL Decode', 'Hash Identifier'],
        'difficulty': 'easy-medium',
    },
    'pwn': {
        'keywords': ['buffer overflow', 'bof', 'rop', 'ret2libc', 'shellcode', 'heap',
                     'format string', '%n', '%x', '%p', 'stack', 'canary', 'pie', 'nx',
                     'aslr', 'dep', 'relro', 'gadget', 'syscall', 'execve', '/bin/sh',
                     'exploit', 'overflow', 'return address', 'eip', 'rip', 'segfault',
                     'race condition', 'uaf', 'use after free', 'tcache', 'fastbin',
                     'arbitrary write', 'arbitrary read', 'leak', 'libc'],
        'tools': ['Pattern Generator', 'Shellcode Generator'],
        'difficulty': 'hard',
    },
    'reversing': {
        'keywords': ['reverse', 'decompile', 'disassemble', 'ghidra', 'ida', 'radare2',
                     'binary', 'elf', 'pe', 'exe', 'dll', 'obfuscate', 'packer',
                     'upx', 'themida', 'vmp', 'arm', 'x86', 'x64', 'mips',
                     'pseudo-code', 'deobfuscate', 'anti-debug', 'anti-vm',
                     'string', 'import', 'export', 'section', '.text', '.data', '.rodata',
                     'entry point', 'oep', 'tls', 'callback', 'license', 'keygen',
                     'crackme', 'flag checker', 'validation'],
        'tools': ['Binary Strings', 'PE Analysis'],
        'difficulty': 'medium-hard',
    },
    'forensics': {
        'keywords': ['forensic', 'memory', 'dump', 'volatility', 'memdump', 'process',
                     'disk', 'image', 'dd', 'raw', 'pcap', 'capture', 'network',
                     'registry', 'hive', 'ntuser', 'sam', 'system', 'software',
                     'event log', 'evtx', 'prefetch', 'shimcache', 'amcache',
                     'usnjrnl', 'mft', 'deleted', 'carve', 'recover', 'stego',
                     'metadata', 'exif', 'strings', 'binwalk', 'foremost',
                     'ntfs', 'fat', 'ext', 'partition', 'boot', 'mbr', 'gpt'],
        'tools': ['Strings', 'File Signatures', 'Entropy Analyzer'],
        'difficulty': 'medium',
    },
    'stego': {
        'keywords': ['stego', 'lsb', 'least significant', 'bit', 'image', 'png', 'jpg',
                     'jpeg', 'bmp', 'gif', 'audio', 'wav', 'mp3', 'spectrogram',
                     'phase', 'echo', 'hidden', 'embed', 'watermark', 'metadata',
                     'exif', 'palette', 'pixel', 'color', 'channel', 'alpha',
                     'whitespace', 'zero-width', 'unicode', 'invisible'],
        'tools': ['File Signatures', 'Entropy Analyzer', 'Strings'],
        'difficulty': 'medium',
    },
    'osint': {
        'keywords': ['osint', 'recon', 'dns', 'subdomain', 'whois', 'email', 'social',
                     'github', 'twitter', 'facebook', 'instagram', 'linkedin',
                     'phone', 'username', 'profile', 'search', 'find', 'locate',
                     'gps', 'coordinate', 'geo', 'map', 'satellite', 'image',
                     'metadata', 'shodan', 'censys', 'virustotal', 'haveibeenpwned',
                     'breach', 'leak', 'password', 'credential', 'dump'],
        'tools': ['Domain Recon', 'Email Lookup'],
        'difficulty': 'easy-medium',
    },
    'misc': {
        'keywords': ['misc', 'programming', 'script', 'algorithm', 'puzzle', 'logic',
                     'math', 'equation', 'number', 'sequence', 'pattern', 'game',
                     'qr', 'barcode', 'color', 'image', 'audio', 'video',
                     'conversion', 'encode', 'decode', 'base', 'radix', 'transformation'],
        'tools': ['Smart Analyzer', 'AI Solver'],
        'difficulty': 'varies',
    },
}

@app.route('/', methods=['GET', 'POST'])
def handle():
    return classify()

@app.route('/api/classify', methods=['GET', 'POST'])
def classify():
    if request.method == 'GET':
        return jsonify({'endpoint': '/api/classify', 'method': 'POST', 'body': {'problem': '...'}})

    data = request.get_json(silent=True) or {}
    problem = (data.get('problem') or '').strip().lower()

    if not problem:
        return jsonify({'success': False, 'error': 'problem is required'}), 400

    scores = {}
    for cat, info in CATEGORIES.items():
        score = 0
        matched = []
        for kw in info['keywords']:
            if kw in problem:
                score += 1
                matched.append(kw)
        if score > 0:
            scores[cat] = {
                'score': score,
                'matched_keywords': matched,
                'tools': info['tools'],
                'difficulty': info['difficulty'],
            }

    if not scores:
        return jsonify({
            'success': True,
            'classification': 'unknown',
            'confidence': 0,
            'suggested_tools': ['Smart Analyzer', 'AI Solver'],
        })

    best = max(scores.items(), key=lambda x: x[1]['score'])
    total = sum(s['score'] for s in scores.values())
    confidence = round(best[1]['score'] / total * 100) if total > 0 else 0

    return jsonify({
        'success': True,
        'classification': best[0],
        'confidence': confidence,
        'all_scores': scores,
        'suggested_tools': best[1]['tools'],
        'difficulty': best[1]['difficulty'],
    })
