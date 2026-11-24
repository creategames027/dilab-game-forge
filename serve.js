import http from 'node:http';import {readFile} from 'node:fs/promises';
const assets=new Set(['index.html','style.css','app.js','core.js','config.js','demo.js','media.js','gallery.js']);
const mime={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8'};
const port=Number(process.env.PORT||8765),base=process.env.BASE_PATH||'/',root=new URL(process.env.PAGES_BUILD==='1'?'docs/':'./',import.meta.url);
http.createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname;
if(path===base.slice(0,-1)&&base!=='/'){res.writeHead(302,{Location:base});return res.end();}
const file=path.startsWith(base)?path.slice(base.length)||'index.html':'';
if(!assets.has(file)||!['GET','HEAD'].includes(req.method)){res.writeHead(404);return res.end('Not found');}
try{const b=await readFile(new URL(file,root));res.writeHead(200,{'Content-Type':mime[file.split('.').pop()],'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:b);}catch{res.writeHead(500);res.end('Server error');}}).listen(port,'127.0.0.1',()=>console.log('Game Forge: http://localhost:'+port+base));