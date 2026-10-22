/** Flavor Kings: exactly one king per row, column and flavor region. Adjacency is allowed. */
export const FLAVORS = [
  {id:0,name:'草莓',color:'#fb8da0',icon:'🍓'},
  {id:1,name:'芒果',color:'#ffd568',icon:'🥭'},
  {id:2,name:'抹茶',color:'#a8cf8b',icon:'🍵'},
  {id:3,name:'蓝莓',color:'#aaa1e1',icon:'🫐'},
  {id:4,name:'奶糖',color:'#f4d5af',icon:'🍬'},
  {id:5,name:'巧克力',color:'#cda38e',icon:'🍫'},
  {id:6,name:'蜜桃',color:'#ffb99d',icon:'🍑'},
  {id:7,name:'薄荷',color:'#8ed2c2',icon:'🌿'},
  {id:8,name:'香草',color:'#eee3a4',icon:'🍦'}
];
const CURATED = [[[8,8,8,8,8,8,8,8,8],[8,6,6,8,8,8,3,5,8],[7,8,6,8,8,8,3,5,8],[7,8,8,8,8,8,3,8,8],[7,7,8,1,1,8,8,7,8],[7,4,8,1,0,2,7,7,8],[7,4,4,7,7,2,7,8,8],[7,7,4,7,7,7,7,7,8],[7,7,7,7,7,7,8,8,8]],[[4,4,7,7,2,2,8,8,8],[4,4,4,2,2,2,2,8,8],[4,6,4,2,2,2,2,8,8],[4,6,4,4,4,8,3,3,8],[6,6,4,0,4,8,8,8,8],[6,6,0,0,1,8,8,8,8],[6,6,6,8,1,1,5,8,8],[6,8,8,8,8,8,8,8,8],[8,8,8,8,8,8,8,8,8]]];
const cells = input => (input || []).map(p => Array.isArray(p) ? {row:p[0],col:p[1]} : {row:p.row,col:p.col});
const key = p => `${p.row},${p.col}`;
const inside = (p,n) => Number.isInteger(p.row)&&Number.isInteger(p.col)&&p.row>=0&&p.col>=0&&p.row<n&&p.col<n;
export function validatePlacements(puzzle, placements=[]) {
  const n=puzzle.size||9, ps=cells(placements), errors=[], conflicts=new Set();
  const seen=new Map();
  for(const p of ps){
    if(!inside(p,n)){errors.push({type:'bounds',cells:[p],message:'棋子超出了棋盘。'});continue;}
    if(seen.has(key(p))){errors.push({type:'duplicate',cells:[p],message:'同一格不能重复放置。'});conflicts.add(key(p));} seen.set(key(p),p);
  }
  const valid=ps.filter(p=>inside(p,n));
  for(const type of ['row','column','region']){
    const groups=new Map();
    for(const p of valid){const id=type==='row'?p.row:type==='column'?p.col:puzzle.regions[p.row][p.col];if(!groups.has(id))groups.set(id,[]);groups.get(id).push(p);}
    for(const [id,group] of groups)if(group.length>1){group.forEach(p=>conflicts.add(key(p)));errors.push({type,id,cells:group,message:`${type==='row'?'每一行':type==='column'?'每一列':'每种口味区域'}只能有一位国王。`});}
  }
  return {valid:errors.length===0,complete:errors.length===0&&ps.length===n,errors,conflicts:[...conflicts].map(k=>seen.get(k))};
}
function search(puzzle, placements=[], limit=2, excluded=[], collect=false){
  if(!validatePlacements(puzzle,placements).valid)return collect?[]:0;
  const n=puzzle.size||9, banned=new Set(cells(excluded).map(key)), rows=new Map(), usedCols=new Set(),usedRegions=new Set();
  for(const p of cells(placements)){if(banned.has(key(p)))return collect?[]:0;rows.set(p.row,p.col);usedCols.add(p.col);usedRegions.add(puzzle.regions[p.row][p.col]);}
  let count=0;const solutions=[];
  function visit(){
    if(count>=limit)return;
    if(rows.size===n){count++;if(collect)solutions.push(Array.from({length:n},(_,r)=>rows.get(r)));return;}
    let bestRow=-1,best=[];
    for(let r=0;r<n;r++)if(!rows.has(r)){
      const opts=[];for(let c=0;c<n;c++)if(!usedCols.has(c)&&!usedRegions.has(puzzle.regions[r][c])&&!banned.has(`${r},${c}`))opts.push(c);
      if(!opts.length)return;
      if(bestRow===-1||opts.length<best.length){bestRow=r;best=opts;}
    }
    for(const c of best){const g=puzzle.regions[bestRow][c];rows.set(bestRow,c);usedCols.add(c);usedRegions.add(g);visit();rows.delete(bestRow);usedCols.delete(c);usedRegions.delete(g);if(count>=limit)return;}
  }
  visit();return collect?solutions:count;
}
export function countSolutions(puzzle, placements=[], limit=2, excluded=[]){return search(puzzle,placements,Math.max(1,limit),excluded);}
export function solvePuzzle(puzzle, placements=[], excluded=[]){return search(puzzle,placements,1,excluded,true)[0]||null;}
export function getCandidates(puzzle, placements=[], excluded=[]){
  const ps=cells(placements), banned=new Set(cells(excluded).map(key)), occupiedRows=new Set(ps.map(p=>p.row)),occupiedCols=new Set(ps.map(p=>p.col)),occupiedRegions=new Set(ps.filter(p=>inside(p,puzzle.size||9)).map(p=>puzzle.regions[p.row][p.col]));
  const out=[];for(let row=0;row<(puzzle.size||9);row++)for(let col=0;col<(puzzle.size||9);col++)if(!occupiedRows.has(row)&&!occupiedCols.has(col)&&!occupiedRegions.has(puzzle.regions[row][col])&&!banned.has(`${row},${col}`))out.push({row,col});return out;
}
export function getHint(puzzle, placements=[], excluded=[]){
  const ps=cells(placements), validation=validatePlacements(puzzle,ps);
  if(!validation.valid)return {type:'conflict',message:validation.errors[0].message,cells:validation.errors[0].cells};
  if(validation.complete)return {type:'complete',message:'九位国王各就各位！每行、每列、每种口味都刚好一位。',cells:[]};
  if(!countSolutions(puzzle,ps,1))return {type:'contradiction',message:'当前棋子没有直接重复，但继续推演会让某行、某列或口味区域无处可放。请撤回最近的放置再试试。',cells:ps};
  if(!countSolutions(puzzle,ps,1,excluded))return {type:'mark-conflict',message:'有一个叉号排除了必需的位置。请先清除一些叉号，再继续推理。',cells:cells(excluded)};
  const candidates=getCandidates(puzzle,ps,excluded);
  for(const type of ['region','row','column']){
    const groups=new Map();for(const p of candidates){const id=type==='region'?puzzle.regions[p.row][p.col]:type==='row'?p.row:p.col;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(p);}
    for(const [id,group] of groups)if(group.length===1){const cell=group[0],label=type==='region'?`${puzzle.flavors?.[id]?.name||'第'+(id+1)+'种口味'}区域`:type==='row'?`第 ${id+1} 行`:`第 ${id+1} 列`;return {type:'place',technique:'single-'+type,cell,cells:[cell],message:`${label}只剩第 ${cell.row+1} 行、第 ${cell.col+1} 列这一格可放：其他格子已被现有国王的行、列、口味限制或你的叉号排除。`};}
  }
  // A candidate is eliminated only after an exhaustive proof that its assumption has no completion.
  for(const cell of candidates)if(!countSolutions(puzzle,[...ps,cell],1,excluded))return {type:'eliminate',technique:'contradiction',cell,cells:[cell],message:`试想把国王放在第 ${cell.row+1} 行、第 ${cell.col+1} 列：逐行推演所有剩余候选，都无法让每列和每种口味恰好一位。因此这格可以画叉。`};
  return {type:'none',cells:[],message:'目前没有必然的一步。试着比较每个口味区域在各行、各列的候选位置。'};
}
export function generatePuzzle(seed=0){
  // Two distinct curated families, each with eight connectivity-preserving symmetries.
  let numeric=typeof seed==='number'?seed:[...String(seed)].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0);
  numeric=(numeric>>>0)%16;
  let regions=CURATED[Math.floor(numeric/8)].map(row=>[...row]);
  if(numeric&1)regions=regions.map(row=>row.reverse());
  if(numeric&2)regions.reverse();
  if(numeric&4)regions=regions[0].map((_,c)=>regions.map(row=>row[c]));
  const puzzle={id:`flavor-kings-${numeric}`,size:9,regions,flavors:FLAVORS.map(f=>({...f})),rules:{onePerRow:true,onePerColumn:true,onePerRegion:true,noTouch:false}};
  return {...puzzle,solution:solvePuzzle(puzzle)};
}
export const getPuzzle=generatePuzzle;
