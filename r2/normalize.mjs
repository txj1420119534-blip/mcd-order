// Reads an explicitly supplied host result file, never credentials or environment.
import {readFile,writeFile} from 'node:fs/promises';
import {normalizeHostBundle} from './readonly-core.js';
const [project,input,output]=process.argv.slice(2);
if(!['order','party','games'].includes(project)||!input||!output){console.error('Usage: node r2/normalize.mjs order|party|games host-results.json|- snapshot.json');process.exit(2);}
try{let bytes;if(input==='-'){const chunks=[];let size=0;for await(const chunk of process.stdin){size+=chunk.length;if(size>2*1024*1024)throw Error();chunks.push(chunk);}bytes=Buffer.concat(chunks);}else bytes=await readFile(input);if(bytes.length>2*1024*1024)throw Error();const snapshot=normalizeHostBundle(JSON.parse(bytes.toString('utf8')),project);await writeFile(output,JSON.stringify(snapshot,null,2)+'\n');console.log('Public snapshot validated and written. No network requests.');}catch{console.error('Snapshot rejected. No raw response was logged; output was not replaced.');process.exitCode=1;}
