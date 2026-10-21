import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const allowed=new Set(['/index.html','/src/app.js','/src/art.js','/src/fixtures.js','/src/rules.js','/src/storage.js','/src/style.css']);
export function resolveRequest(rawUrl,method='GET'){
 if(!['GET','HEAD'].includes(method))return {status:405};
 let pathname;try{pathname=decodeURIComponent(new URL(rawUrl,'http://localhost').pathname);}catch{return {status:400};}
 if(pathname==='/')pathname='/index.html';
 if(!allowed.has(pathname))return {status:404};
 return {status:200,file:path.join(root,pathname),type:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[path.extname(pathname)]};
}
export function createDemoServer(){return http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
 const match=resolveRequest(req.url,req.method);if(match.status!==200){res.statusCode=match.status;res.setHeader('Content-Type','text/plain; charset=utf-8');if(match.status===405)res.setHeader('Allow','GET, HEAD');return res.end(req.method==='HEAD'?'':match.status===405?'Method not allowed':'Not found');}
 try{const data=await readFile(match.file);res.setHeader('Content-Type',match.type);res.end(req.method==='HEAD'?undefined:data);}catch{res.statusCode=404;res.end('Not found');}
});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||4176);
 if(!Number.isInteger(port)||port<1||port>65535){console.error('PORT must be an integer from 1 to 65535.');process.exit(1);}
 const server=createDemoServer();server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is already in use. Close the existing demo or choose PORT.`:`Demo server could not start: ${error.code||error.message}`);process.exitCode=1;});
 server.listen(port,'127.0.0.1',()=>console.log(`DEMO http://127.0.0.1:${port}`));
}
