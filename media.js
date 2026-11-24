import {TEXTURE_MODEL} from './config.js';
export const MEDIA=Object.freeze({
 texture:{model:TEXTURE_MODEL,type:'image'},
 music:{type:'local'},
 sound:{type:'local'}
});
export function mediaRequest(kind,prompt){
 if(kind!=='texture')throw Error('Audio is synthesized locally; no API endpoint.');
 if(typeof prompt!=='string'||!prompt.trim()||prompt.length>1000)throw Error('Enter an asset description (1–1000 characters).');
 return 'https://gen.pollinations.ai/image/'+encodeURIComponent('Seamless tileable game texture, no text, flat even lighting: '+prompt.trim())+'?'+new URLSearchParams({model:TEXTURE_MODEL,width:'512',height:'512',safe:'privacy,secrets,sexual,violence'});
}
export function validateAssets(assets){
 const out={};for(const kind of Object.keys(MEDIA)){
  const v=assets?.[kind];if(v===undefined)continue;
  const pattern=kind==='texture'?/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/:/^data:audio\/(?:mpeg|mp3|wav|ogg|webm|mp4|aac|flac);base64,[A-Za-z0-9+/=]+$/;
  if(typeof v!=='string'||v.length>3_000_000||!pattern.test(v))throw Error('Invalid or oversized '+kind+' asset.');
  out[kind]=v;
 }return out;
}
export async function fetchMedia(kind,prompt,token,signal,fetcher=fetch){
 const url=mediaRequest(kind,prompt);
 if(!token)throw Error('Connect Pollinations first.');
 const response=await fetcher(url,{headers:{Authorization:'Bearer '+token},credentials:'omit',redirect:'error',signal});
 if(!response.ok)throw Error('Texture request failed (HTTP '+response.status+'). Check your approved permissions and balance.');
 const blob=await response.blob();if(blob.size>2_000_000)throw Error('Generated texture is too large.');
 if(!blob.type.startsWith('image/'))throw Error('Unexpected image format.');
 const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Could not read texture.'));r.readAsDataURL(blob);});
 return validateAssets({texture:data}).texture;
}
export function assetScript(assets){
 const a=validateAssets(assets);
 return '<script>Object.defineProperty(window,"FORGE_ASSETS",{value:Object.freeze('+JSON.stringify(a)+'),writable:false});<\/script>';
}
// Original procedural audio, rendered by Web Audio offline, no network or API key.
export function audioPlan(kind,prompt){
 if(!['music','sound'].includes(kind)||typeof prompt!=='string'||!prompt.trim()||prompt.length>1000)throw Error('Describe your audio (1–1000 characters).');
 let state=2166136261;for(const c of prompt)state=Math.imul(state^c.codePointAt(0),16777619)>>>0;
 const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const p=prompt.toLowerCase(),calm=/calm|soft|cozy|ambient|спокой|мягк|уют/.test(p),dark=/dark|mystery|spooky|sad|мрач|таин|груст/.test(p),fast=/fast|arcade|upbeat|energetic|быстр|аркад/.test(p);
 const root=48+Math.floor(rand()*12),hz=n=>440*2**((n-69)/12),notes=[],tone=(t,d,f,to,vol,wave)=>notes.push({t,d,f,to,vol,wave});
 if(kind==='music'){
  const beat=calm?.5:fast?.25:.375,duration=16*beat;
  const scale=dark?[0,3,5,7,10,12]:[0,2,4,7,9,12];
  const chords=dark?[0,5,3,7]:[0,5,7,0];
  for(let i=0;i<16;i++){
   const chord=chords[Math.floor(i/4)],n=root+12+scale[Math.floor(rand()*scale.length)];
   tone(i*beat,beat*.74,hz(n),hz(n),.13,calm?'triangle':'square');
   if(i%2===0)tone(i*beat,beat*1.65,hz(root-12+chord),hz(root-12+chord),.17,'triangle');
   if(i%4===0)tone(i*beat,.10,100,46,.15,'sine');
   if(!calm&&i%2===1)tone(i*beat,.035,1400,800,.045,'square');
  }return {duration,notes};
 }
 const negative=/error|fail|lose|hit|ошиб|проиг|удар/.test(p),jump=/jump|bounce|прыж/.test(p),start=negative?520:jump?250:420+Math.floor(rand()*200);
 const sequence=negative?[0,-4,-9]:jump?[0,7,12]:[0,4,12];
 for(let i=0;i<3;i++){const f=start*2**(sequence[i]/12);tone(i*.10,.13,f,f*(negative?.65:1.2),.17,calm?'sine':'triangle');}
 return {duration:.46,notes};
}
export function encodeWav(samples,rate){
 // 8-bit mono PCM keeps exported games small. Samples are normalized to a modest level.
 const bytes=new Uint8Array(44+samples.length+(samples.length%2));const v=new DataView(bytes.buffer);
 const tag=(o,s)=>{for(let i=0;i<s.length;i++)bytes[o+i]=s.charCodeAt(i);};
 tag(0,'RIFF');v.setUint32(4,bytes.length-8,true);tag(8,'WAVE');tag(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate,true);v.setUint16(32,1,true);v.setUint16(34,8,true);tag(36,'data');v.setUint32(40,samples.length,true);
 for(let i=0;i<samples.length;i++)bytes[44+i]=Math.max(0,Math.min(255,Math.round(128+127*Math.max(-1,Math.min(1,samples[i])))));
 let str='';for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return 'data:audio/wav;base64,'+btoa(str);
}
export async function synthesizeAudio(kind,prompt,signal){
 const plan=audioPlan(kind,prompt);
 const Offline=globalThis.OfflineAudioContext||globalThis.webkitOfflineAudioContext;
 if(!Offline)throw Error('This browser does not support offline Web Audio.');
 const rate=12000,ctx=new Offline(1,Math.ceil(plan.duration*rate),rate);
 for(const n of plan.notes){
  const o=ctx.createOscillator(),g=ctx.createGain();o.type=n.wave;o.frequency.setValueAtTime(n.f,n.t);o.frequency.exponentialRampToValueAtTime(n.to,n.t+n.d);
  g.gain.setValueAtTime(0,n.t);g.gain.linearRampToValueAtTime(n.vol,n.t+.008);g.gain.exponentialRampToValueAtTime(.0001,n.t+n.d);o.connect(g);g.connect(ctx.destination);o.start(n.t);o.stop(n.t+n.d);
 }
 const buffer=await ctx.startRendering();if(signal?.aborted)throw new DOMException('Aborted','AbortError');
 return validateAssets({[kind]:encodeWav(buffer.getChannelData(0),rate)})[kind];
}
