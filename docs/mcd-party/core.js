export const MENU = [
 {id:'burger',name:'经典牛肉汉堡',tag:'主食 · 含肉',price:22,icon:'🍔',kind:'meat'},
 {id:'chicken',name:'香脆鸡腿堡',tag:'主食 · 含肉',price:24,icon:'🍔',kind:'meat'},
 {id:'fries',name:'分享薯条',tag:'小食 · 配料待核实',price:15,icon:'🍟',kind:'side'},
 {id:'nuggets',name:'分享鸡块',tag:'小食 · 含肉',price:18,icon:'🍗',kind:'meat'},
 {id:'drink',name:'气泡饮料',tag:'饮品 · 甜度按门店选择',price:10,icon:'🥤',kind:'drink'},
 {id:'tea',name:'无糖茶饮',tag:'饮品 · 演示选项',price:12,icon:'🧋',kind:'drink'},
 {id:'dessert',name:'香草冰淇淋',tag:'甜点 · 含乳',price:9,icon:'🍦',kind:'dessert'}
];
export const DEFAULT = {theme:'birthday',people:8,budget:75,date:'',time:'18:00',city:'上海',store:'静安灵感店',session:'晚间 18:00–20:00',diet:'regular',step:0,quantities:{burger:8,chicken:0,fries:4,nuggets:2,drink:8,tea:0,dessert:8},agenda:[{time:'00:00',title:'集合！给今天取个名字',detail:'每人写一个今天的心情关键词，放进主题卡。'},{time:'00:15',title:'开吃，交换一个快乐瞬间',detail:'两人一组分享最近的小确幸，再一起给朋友拍张合照。'},{time:'00:45',title:'默契大挑战',detail:'抽取三个轻松问题：最近单曲循环？理想周末？最想去的城市？允许跳过。'},{time:'01:15',title:'许个愿，把快乐打包',detail:'送上一句祝福，用合照结束今天。离场前一起整理桌面。'}]};
export function fresh(){return structuredClone(DEFAULT)}
export function validate(s){const errors=[];if(!Number.isInteger(Number(s.people))||s.people<2||s.people>30)errors.push('参与人数需为 2–30 位成年人。');if(!Number.isFinite(Number(s.budget))||s.budget<20||s.budget>500)errors.push('人均预算需在 ¥20–500 之间。');if(s.date&&!/^\d{4}-\d{2}-\d{2}$/.test(s.date))errors.push('请选择有效日期。');else if(s.date){const d=new Date(s.date+'T00:00:00Z');if(isNaN(d)||d.toISOString().slice(0,10)!==s.date)errors.push('请选择有效日期。');}return errors;}
export function totals(s){const total=MENU.reduce((a,m)=>a+m.price*(s.quantities[m.id]||0),0);return {total,perPerson:total/s.people,limit:s.people*s.budget,remaining:s.people*s.budget-total,items:Object.values(s.quantities).reduce((a,b)=>a+b,0)};}
export function changeQuantity(s,id,delta){if(!MENU.some(m=>m.id===id)||!Number.isInteger(delta))return s;return {...s,quantities:{...s.quantities,[id]:Math.max(0,Math.min(100,(s.quantities[id]||0)+delta))}};}
export function recommend(s){if(validate(s).length)throw new Error(validate(s)[0]);const p=Number(s.people),q=Object.fromEntries(MENU.map(m=>[m.id,0]));if(s.diet!=='lessmeat')q.burger=p;else q.burger=Math.ceil(p/2);q.fries=Math.ceil(p/2);q.nuggets=s.diet==='lessmeat'?0:Math.ceil(p/4);q[s.diet==='lesssugar'?'tea':'drink']=p;q.dessert=s.diet==='lesssugar'?0:p;return {...s,people:p,budget:Number(s.budget),quantities:q};}
export function save(storage,s){storage.setItem('party-studio-v1',JSON.stringify({...s,version:1}));}
export function restore(storage){
 try {
  const s=JSON.parse(storage.getItem('party-studio-v1'));
  if(!s||s.version!==1||typeof s.date!=='string'||validate(s).length||!['birthday','friends','interest'].includes(s.theme)||!['regular','lessmeat','lesssugar'].includes(s.diet))return fresh();
  if(typeof s.time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time))return fresh();
  for(const field of ['city','store','session'])if(typeof s[field]!=='string'||!s[field].trim()||s[field].length>100)return fresh();
  if(agendaErrors(s.agenda).length)return fresh();
  const q={};
  for(const m of MENU){
   const n=s.quantities?.[m.id];if(!Number.isInteger(n)||n<0||n>100)return fresh();q[m.id]=n;
  }
  return {theme:s.theme,people:Number(s.people),budget:Number(s.budget),date:s.date,time:s.time,city:s.city,store:s.store,session:s.session,diet:s.diet,step:[0,1,2,3].includes(s.step)?s.step:0,quantities:q,agenda:s.agenda.map(({time,title,detail})=>({time,title,detail}))};
 }catch{return fresh();}
}
export function shareText(s){const t=totals(s);return `一起，把快乐组个局！\n个人创意聚会计划 · 非官方服务 · 全部餐品与价格为演示数据\n主题：${getTheme(s.theme).name}\n日期：${s.date||'待定'} ${s.time}\n成年人：${s.people} 位\n演示地点：${s.city} / ${s.store} / ${s.session}（无真实门店或时段可用性）\n预算：¥${s.budget}/人，总预算 ¥${t.limit}\n餐单：\n${MENU.filter(m=>s.quantities[m.id]).map(m=>`${m.name} × ${s.quantities[m.id]} = ¥${m.price*s.quantities[m.id]}`).join('\n')}\n合计 ¥${t.total}，人均 ¥${t.perPerson.toFixed(2)}${t.remaining<0?'，超预算 ¥'+(-t.remaining):''}\n流程（相对开始时间）：\n${s.agenda.map(a=>`${a.time} ${a.title}\n${a.detail}`).join('\n')}\n食物配料、过敏原、实际价格及聚会许可请自行向真实门店核实。本计划不代表预订、付款或任何官方承诺。`;}


// Local creative planning only. These themes are not official purchasable packages.
export const THEMES = [
 {id:'birthday',name:'生日愿望局',short:'生日',eyebrow:'MAKE A WISH',tag:'让今天，有一点特别',color:'#ece0f5',symbol:'✳',description:'围坐、分享、认真许愿。给大朋友也留一份生日仪式感。'},
 {id:'friends',name:'好友充电局',short:'朋友',eyebrow:'GOOD TO SEE YOU',tag:'见面就是好日子',color:'#dfedce',symbol:'☺',description:'不用特别的理由，把好好吃饭和好好聊天放在一起。'},
 {id:'interest',name:'同好碰头局',short:'同好',eyebrow:'OUR LITTLE CLUB',tag:'把喜欢的事，聊个够',color:'#ffedb5',symbol:'✦',description:'带着一个共同爱好来，带着一些新灵感回去。'}
];
export function getTheme(id){return THEMES.find(t=>t.id===id)||THEMES[0];}
export function themeAgenda(theme){
 if(theme==='birthday')return structuredClone(DEFAULT.agenda);
 if(theme==='friends')return [
  {time:'00:00',title:'终于见面，先充个电',detail:'每人用一个词形容最近。愿意说多少都可以，先一起把手机放一会儿。'},
  {time:'00:15',title:'边吃边交换小确幸',detail:'分享最近发现的一首歌、一部片，或者一件微不足道却开心的小事。'},
  {time:'00:45',title:'朋友默契三选一',detail:'理想周末选城市漫游、宅家电影，还是户外散步？可以只听不说。'},
  {time:'01:15',title:'把下次见面也安排上',detail:'征求大家同意后合照，记下一件下次想做的小事，离场前一起整理桌面。'}
 ];
 return [
  {time:'00:00',title:'亮出你的兴趣关键词',detail:'用三个词介绍最近的爱好。不需要展示私人账号或联系方式。'},
  {time:'00:15',title:'一边吃，一边交换入坑故事',detail:'两人一组聊聊最初怎么喜欢上这个兴趣，新朋友也能轻松加入。'},
  {time:'00:45',title:'一分钟自愿安利',detail:'推荐一本书、一首歌或一个作品。所有分享都自愿，不想发言可以安心旁听。'},
  {time:'01:15',title:'把灵感带回家',detail:'记录一个大家想尝试的活动，合照前征求参与者同意，离场前整理桌面。'}
 ];
}
export function agendaErrors(agenda){
 if(!Array.isArray(agenda)||agenda.length!==4)return ['请保留四段完整流程。'];
 const errors=[];let last=-1;
 for(const a of agenda){
  if(!a||typeof a.time!=='string'||!/^\d{2}:[0-5]\d$/.test(a.time)){errors.push('流程时间请使用时:分，例如 00:15。');continue;}
  const [h,m]=a.time.split(':').map(Number),minutes=h*60+m;
  if(minutes>360)errors.push('流程请安排在开始后的 6 小时以内。');
  if(minutes<=last)errors.push('流程时间需要依次向后，请调整重复或倒序时间。');
  last=minutes;
  if(typeof a.title!=='string'||!a.title.trim()||a.title.length>80||typeof a.detail!=='string'||!a.detail.trim()||a.detail.length>500)errors.push('请填写每段活动的标题和说明。');
 }
 return [...new Set(errors)];
}
export function coverage(s){
 const main=(s.quantities.burger||0)+(s.quantities.chicken||0),drinks=(s.quantities.drink||0)+(s.quantities.tea||0);
 return {main,drinks,mainMissing:Math.max(0,s.people-main),drinksMissing:Math.max(0,s.people-drinks),empty:totals(s).items===0};
}
export function trimExtras(s){
 // Explicit optional action: reduce extras only. Never remove mains/drinks or add food.
 let next=structuredClone(s);
 for(const id of ['dessert','nuggets','fries']){
  while(totals(next).remaining<0&&next.quantities[id]>0)next=changeQuantity(next,id,-1);
 }
 return next;
}
export function planReadiness(s){
 const warnings=[...validate(s),...agendaErrors(s.agenda)];
 const t=totals(s),c=coverage(s);
 if(t.remaining<0)warnings.push('餐单超出总预算 ¥'+(-t.remaining)+'，你可以调整份数或预算。');
 if(c.empty)warnings.push('餐单还没有食物，请添加你们想吃的餐品。');
 else {
  if(c.mainMissing)warnings.push('主食比人数少 '+c.mainMissing+' 份，请确认分享安排。');
  if(c.drinksMissing)warnings.push('饮品比人数少 '+c.drinksMissing+' 份，请确认是否自带饮品。');
 }
 return warnings;
}
