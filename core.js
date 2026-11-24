import {assetScript,validateAssets} from './media.js';
export const MAX_HTML = 180000;
const MAX_LINK = 120000;
export function extractGame(text) {
  if (typeof text !== 'string') throw Error('The model returned no game.');
  let code = text.trim().replace(/^\x60\x60\x60(?:html)?\s*/i,'').replace(/\s*\x60\x60\x60$/,'').trim();
  const start = code.search(/<!doctype\s+html[^>]*>|<html(?:\s|>)/i);
  const end = code.toLowerCase().lastIndexOf('</html>');
  if (start < 0 || end < start || !/<body(?:\s|>)/i.test(code)) throw Error('Incomplete HTML. Try again or choose a model with a longer output.');
  code = code.slice(start,end+7);
  if (new TextEncoder().encode(code).length > MAX_HTML) throw Error('Game exceeds the 180 KB size limit.');
  if (!/<script(?:\s|>)/i.test(code)) throw Error('The result has no game script.');
  return code;
}
export function titleOf(code){return (code.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || 'Untitled game').trim().slice(0,90);}
export function sandboxDocument(code,assets={}) {
  const clean = extractGame(code).replace(/^<!doctype[^>]*>/i,'');
  const policy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
  const header = '<meta http-equiv="Content-Security-Policy" content="'+policy+'"><meta name="referrer" content="no-referrer"><script>(()=>{const report=e=>parent.postMessage({forgeError:String(e).slice(0,300)}, "*");window.addEventListener("error",e=>report(e.message||"Game script error"));window.addEventListener("unhandledrejection",e=>report(e.reason||"Promise rejected"));})()<\/script>';
  // Insert CSP and embedded texture/local WAV assets before any game script. No remote audio requests.
  return '<!doctype html>'+header+assetScript(assets)+clean;
}
function b64url(bytes){let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function fromB64(s){if(!/^[A-Za-z0-9_-]+$/.test(s))throw Error('Invalid game link.');const raw=atob(s.replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,c=>c.charCodeAt(0));}
export async function packGame(code,assets={}){
 const clean=extractGame(code); const a=validateAssets(assets); const raw=new TextEncoder().encode(Object.keys(a).length?JSON.stringify({code:clean,assets:a}):clean);
 const gzip=await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
 const link=b64url(new Uint8Array(gzip));if(link.length>MAX_LINK)throw Error('Game is too large for a portable link. Download HTML instead.');
 return link;
}
export async function unpackBundle(link){
 if(typeof link!=='string'||link.length>MAX_LINK)throw Error('Invalid or oversized game link.');
 const reader=new Blob([fromB64(link)]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
 const decoder=new TextDecoder('utf-8',{fatal:true});let size=0,out='';
 try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>MAX_HTML+9_000_000)throw Error('Game exceeds the size limit.');out+=decoder.decode(value,{stream:true});}out+=decoder.decode();}finally{await reader.cancel().catch(()=>{});}
 if(out.startsWith("{")){const b=JSON.parse(out);return {code:extractGame(b.code),assets:validateAssets(b.assets)}}
 return {code:extractGame(out),assets:{}};
}
export async function unpackGame(link){return (await unpackBundle(link)).code;}
export async function pkce(){
 const verifier=b64url(crypto.getRandomValues(new Uint8Array(32)));
 const state=b64url(crypto.getRandomValues(new Uint8Array(24)));
 const challenge=b64url(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
 return {verifier,state,challenge};
}
