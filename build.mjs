import {rm,mkdir,cp} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');for(const p of ['index.html','src','assets'])await cp(p,`dist/${p}`,{recursive:true});console.log('Built static demo → dist/');
