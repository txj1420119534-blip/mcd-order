import {mkdir,cp} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const name of ["index.html","src","r2"])await cp(name,'dist/'+name,{recursive:true});
console.log('R2 static snapshot build ready: dist/');
