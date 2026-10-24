import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {name}=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));const mount=`/${name}`;
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');if(url.pathname===mount){res.writeHead(302,{Location:mount+'/'}).end();return;}const relative=url.pathname.startsWith(mount+'/')?url.pathname.slice(mount.length):url.pathname;const file=path.resolve(root,'.'+decodeURIComponent(relative==='/'?'/index.html':relative));
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);
 }catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/`));
