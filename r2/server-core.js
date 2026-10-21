import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const common=['/r2/readonly.js','/r2/readonly-core.js','/r2/readonly.css','/r2/snapshot.js','/r2/snapshot.json'];
const projectFiles={order:['/src/app.js','/src/art.js','/src/fixtures.js','/src/rules.js','/src/storage.js','/src/style.css'],party:['/app.js','/core.js','/style.css','/party.svg'],games:['/app.js','/engines.js','/ledger.js','/puzzle.js','/style.css']};
export function resolvePublicRequest(rawUrl,method,root,project){
  if(!['GET','HEAD'].includes(method))return {status:405};
  let name;try{name=decodeURIComponent(new URL(rawUrl,'http://localhost').pathname);}catch{return {status:400};}
  if(name==='/')name='/index.html';
  if(!['/index.html',...common,...(projectFiles[project]||[])].includes(name))return {status:404};
  return {status:200,file:path.join(root,name),type:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'})[path.extname(name)]};
}
export function createR2Server(root,project){return http.createServer(async(req,res)=>{
  const result=resolvePublicRequest(req.url,req.method,root,project);
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
  if(result.status!==200){res.statusCode=result.status;if(result.status===405)res.setHeader('Allow','GET, HEAD');return res.end(req.method==='HEAD'?'':'Not found or method not allowed');}
  try{const bytes=await readFile(result.file);res.setHeader('Content-Type',result.type);res.end(req.method==='HEAD'?undefined:bytes);}catch{res.statusCode=404;res.end('Not found');}
});}
