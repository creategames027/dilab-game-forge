import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),out=new URL('docs/',root);
const assets=['index.html','style.css','app.js','core.js','config.js','demo.js'];
const config=await readFile(new URL('config.js',root),'utf8');
const match=config.match(/export const APP_KEY = ['"]([^'"]*)['"]/);
if(!match||(match[1]&&!match[1].startsWith('pk_')))throw new Error('APP_KEY must be empty or a publishable pk_ key.');
for(const file of assets){const source=await readFile(new URL(file,root),'utf8');if(/sk_[A-Za-z0-9_-]{20,}/.test(source))throw new Error('Possible secret in '+file);}
await mkdir(out,{recursive:true});
for(const file of assets)await copyFile(new URL(file,root),new URL(file,out));
await writeFile(new URL('.nojekyll',out),'');
console.log('GitHub Pages: docs/ ready (6 static assets + .nojekyll).');
