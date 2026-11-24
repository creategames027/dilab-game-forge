export const MEDIA = Object.freeze({
 texture:{model:'tongyi-mai/z-image-turbo',prompt:'Seamless tileable game texture, no text, flat even lighting: ',params:{width:'512',height:'512',safe:'privacy,secrets,sexual,violence'},type:'image',paid:false},
 music:{model:'elevenlabs/music-v2.5',prompt:'Original instrumental game soundtrack, no vocals: ',params:{duration:'8',instrumental:'true',safe:'privacy,secrets,sexual,violence'},type:'audio',paid:true},
 sound:{model:'elevenlabs/eleven-text-to-sound-v3',prompt:'Original short game sound effect: ',params:{duration:'2',safe:'privacy,secrets,sexual,violence'},type:'audio',paid:true}
});
export function mediaRequest(kind,prompt){
 const m=MEDIA[kind];if(!m||!prompt.trim()||prompt.length>1000)throw Error('Enter an asset description (1–1000 characters).');
 const path=m.type==='image'?'image':'audio';
 return 'https://gen.pollinations.ai/'+path+'/'+encodeURIComponent(m.prompt+prompt.trim())+'?'+new URLSearchParams({model:m.model,...m.params});
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
 const response=await fetcher(mediaRequest(kind,prompt),{headers:{Authorization:'Bearer '+token},credentials:'omit',redirect:'error',signal});
 if(!response.ok)throw Error('Media request failed (HTTP '+response.status+'). Audio models may require paid Pollen; check your approved permissions and balance.');
 const blob=await response.blob();if(blob.size>2_000_000)throw Error('Generated asset is too large. Try a shorter or smaller asset.');
 if(!blob.type.startsWith(MEDIA[kind].type+'/'))throw Error('Unexpected media format.');
 const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Could not read asset.'));r.readAsDataURL(blob);});
 return validateAssets({[kind]:data})[kind];
}
export function assetScript(assets){
 const a=validateAssets(assets);
 return '<script>Object.defineProperty(window,"FORGE_ASSETS",{value:Object.freeze('+JSON.stringify(a)+'),writable:false});<\/script>';
}
