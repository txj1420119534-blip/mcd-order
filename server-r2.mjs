import {fileURLToPath} from 'node:url';
import {createR2Server} from './r2/server-core.js';
const port=process.argv.includes('--port')?Number(process.argv[process.argv.indexOf('--port')+1]):41860;
if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid port');
const server=createR2Server(fileURLToPath(new URL('.',import.meta.url)),'order');
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Port busy; choose --port. No other process was stopped.':'Local server failed');process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log('R2 order http://127.0.0.1:'+server.address().port));
