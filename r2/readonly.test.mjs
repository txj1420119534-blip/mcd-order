import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {validateSnapshot,normalizeHostRecord} from './readonly-core.js';
import {resolvePublicRequest,createR2Server} from './server-core.js';
const snapshot=JSON.parse(await readFile(new URL('./snapshot.json',import.meta.url)));
test('bundled snapshot validates with all linked public records',()=>{assert.equal(validateSnapshot(snapshot,snapshot.project).records.length,snapshot.records.length);});
test('snapshot cannot claim live mode, another project, failed business, write or private tool',()=>{
 for(const change of [s=>s.mode='live',s=>s.project='unknown',s=>s.records[0].status.code=401,s=>s.records[0].status.success=false,s=>s.records[0].status.mcpIsError=true,s=>s.records[0].tool='create_order',s=>s.records[0].tool='query_my_account',s=>s.records[0].args.token='do-not-accept']){const s=structuredClone(snapshot);change(s);assert.throws(()=>validateSnapshot(s,snapshot.project));}
});
test('host failure, missing structured data and missing essential fields fail closed',()=>{
 const record=snapshot.records[0];const base={tool:record.tool,args:record.args,capturedAt:record.capturedAt,result:{isError:false,structuredContent:{success:true,code:200,datetime:'sample',traceId:'123456789',data:record.data}}};
 assert.ok(normalizeHostRecord(snapshot.project,base));
 for(const patch of [r=>r.result.isError=true,r=>r.result.structuredContent.success=false,r=>r.result.structuredContent.code=500,r=>delete r.result.structuredContent,r=>r.result.structuredContent.data=null]){const r=structuredClone(base);patch(r);assert.throws(()=>normalizeHostRecord(snapshot.project,r));}
});
test('projection removes user subscriptions, coupon data and employee identifiers',()=>{
 const s=structuredClone(snapshot);s.extra='ignored';s.records[0].data.private='ignored';
 const out=validateSnapshot(s,snapshot.project);assert.equal(out.extra,undefined);assert.equal(out.records[0].data.private,undefined);
 if(snapshot.project==='party'){const rec=s.records.find(x=>x.tool==='query_party_store_session');rec.data[0].cookEmpNo='private';assert.equal(validateSnapshot(s,'party').records.at(-1).data[0].cookEmpNo,undefined);}
});
test('bad linked store, date or product is rejected',()=>{
 if(snapshot.project==='games')return;
 const s=structuredClone(snapshot),r=s.records.at(-1);r.args.storeCode='0000000';assert.throws(()=>validateSnapshot(s,snapshot.project));
});
test('HTTP allowlist exposes only frontend and public snapshot, rejects writes and encoded paths',async()=>{
 const root=new URL('../',import.meta.url).pathname;
 for(const name of ['/server-r2.mjs','/r2/normalize.mjs','/r2/CONTRACTS.md','/.env','/.git/config','/%2e%2e/.env','/%00','/%zz'])assert.notEqual(resolvePublicRequest(name,'GET',root,snapshot.project).status,200);
 assert.equal(resolvePublicRequest('/r2/snapshot.json','GET',root,snapshot.project).status,200);assert.equal(resolvePublicRequest('/','POST',root,snapshot.project).status,405);
 const server=createR2Server(new URL('../',import.meta.url),snapshot.project); // method rejection doesn't read a file
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const res=await fetch(`http://127.0.0.1:${server.address().port}/`,{method:'POST'});assert.equal(res.status,405);}finally{await new Promise(resolve=>server.close(resolve));}
});
