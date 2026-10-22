// Public-data projection only. This module has no network or credential access.
export const PROJECT_TOOLS = {
  order: ['campaign_calendar','query_nearby_stores','query_meals','calculate_price'],
  party: ['mall_points_products','query_party_city','query_party_store','query_party_store_date','query_party_store_session'],
  games: ['campaign_calendar']
};
const fail = () => { throw new Error('快照格式或业务状态未通过校验；未替换当前数据'); };
const obj = v => v && typeof v === 'object' && !Array.isArray(v) ? v : fail();
const str = v => typeof v === 'string' && v.length <= 12000 ? v : fail();
const num = v => typeof v === 'number' && Number.isFinite(v) ? v : fail();
const cents = v => Number.isSafeInteger(v) && v >= 0 ? v : fail();
const bool = v => typeof v === 'boolean' ? v : fail();
const list = (v, fn, max=1000) => Array.isArray(v) && v.length <= max ? v.map(fn) : fail();
const date = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(v+'T00:00:00Z').toISOString().slice(0,10) === v ? v : fail();
const time = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v) && Number.isFinite(Date.parse(v)) ? v : fail();
function pick(v, spec) {
  obj(v); const out={};
  for(const [key,fn] of Object.entries(spec)) if(v[key] !== undefined) out[key]=fn(v[key]);
  return out;
}
function required(v, keys) { for(const k of keys) if(v[k]===undefined) fail(); return v; }
function argsFor(tool, value) {
  obj(value);
  const specs={
    campaign_calendar:{specifiedDate:date},
    query_nearby_stores:{beType:num,city:str,keyword:str,searchType:num},
    query_meals:{beType:num,orderType:num,storeCode:str,reservationDate:str},
    calculate_price:{beType:num,orderType:num,storeCode:str,reservationDate:str,items:v=>list(v,x=>required(pick(x,{productCode:str,quantity:num}),['productCode','quantity']),50)},
    mall_points_products:{catRuleIds:str},query_party_city:{spuId:num},
    query_party_store:{code:str,latitude:num,longitude:num,spuId:num},
    query_party_store_date:{spuId:num,storeCode:str},query_party_store_session:{spuId:num,storeCode:str,dateStr:date}
  };
  if(Object.keys(value).some(k=>!Object.hasOwn(specs[tool],k))) fail();
  const a=pick(value,specs[tool]);
  if(tool==='query_nearby_stores' && (a.beType!==1 || a.searchType!==2 || !a.city || !a.keyword)) fail();
  if(['query_meals','calculate_price'].includes(tool) && (a.beType!==1 || a.orderType!==1 || !/^\d+$/.test(a.storeCode||''))) fail();
  if(tool==='calculate_price' && (!a.items?.length || a.items.some(x=>!Number.isSafeInteger(x.quantity)||x.quantity<1))) fail();
  if(tool.startsWith('query_party_') && (!Number.isSafeInteger(a.spuId)||a.spuId<1)) fail();
  if(tool==='query_party_store' && !a.code) fail();
  if(['query_party_store_date','query_party_store_session'].includes(tool) && !a.storeCode) fail();
  if(tool==='query_party_store_session' && !a.dateStr) fail();
  return a;
}
const reservation = v => required(pick(v,{date:date,today:bool,reservationOptionText:str}),['date','today','reservationOptionText']);
function dataFor(tool, raw) {
  if(tool==='campaign_calendar') return {currentTime:str(raw.currentTime),dailyList:list(raw.dailyList,d=>({date:date(d.date),today:bool(d.today),events:list(d.events,e=>({title:str(e.title ?? e.articleDto?.title ?? e.activityTitle ?? ''),description:str(e.description ?? e.articleDto?.content ?? e.activitySubTitle ?? ''),eventType:num(e.eventType)}),100)}),100)};
  if(tool==='query_nearby_stores') return list(raw,s=>required(pick(s,{storeCode:str,storeName:str,address:str,distance:num,businessStatus:bool,businessStartTime:str,businessEndTime:str,reservation:bool,reservationTimeOptions:v=>list(v,reservation,100)}),['storeCode','storeName','address','reservation','reservationTimeOptions']));
  if(tool==='query_meals') return {
    categories:list(raw.categories,c=>({name:str(c.name),meals:list(c.meals,m=>({code:str(m.code)}))})),
    meals:Object.fromEntries(Object.entries(obj(raw.meals)).map(([code,m])=>[str(code),required(pick(m,{name:str,currentPrice:str,originalPrice:str,discountType:str}),['name','currentPrice'])]))
  };
  if(tool==='calculate_price') return required(pick(raw,{price:cents,originalPrice:cents,productPrice:cents,productOriginalPrice:cents,discount:cents,deliveryPrice:cents,packingPrice:cents,tablewarePrice:cents,productList:v=>list(v,p=>required(pick(p,{productCode:str,productName:str,quantity:num,originalSubtotal:cents,subtotal:cents}),['productCode','productName','quantity','subtotal']),100)}),['price','productList']);
  if(tool==='mall_points_products') return list(raw,p=>required(pick(p,{spuName:str,spuId:num,point:str,price:str,selling:str,upTime:str,downTime:str,catName:str,status:num,shopId:num}),['spuName','spuId','point','price','selling','upTime','downTime']));
  if(tool==='query_party_city') return list(raw,c=>required(pick(c,{code:num,name:str,latitude:num,longitude:num}),['code','name','latitude','longitude']));
  if(tool==='query_party_store') return list(raw,s=>required(pick(s,{code:str,name:str,address:str,cityCode:str,cityName:str,latitude:num,longitude:num,businessStatus:num,onlineBusinessStatus:bool}),['code','name','address']));
  if(tool==='query_party_store_date') return list(raw,d=>required(pick(d,{date:date,storeCode:str,spuId:num}),['date','storeCode']));
  if(tool==='query_party_store_session') return list(raw,s=>required(pick(s,{id:num,leftNum:num,partyMax:num,partyMin:num,price:num,timeEnd:str,timeStart:str}),['id','timeStart','timeEnd','leftNum','price']));
  fail();
}
export function normalizeHostRecord(project, record) {
  obj(record); const tool=record.tool;
  if(!PROJECT_TOOLS[project]?.includes(tool)) fail();
  const result=obj(record.result); if(result.isError!==false) fail();
  const response=obj(result.structuredContent);
  if(response.success!==true || response.code!==200) fail();
  return {tool,args:argsFor(tool,record.args),capturedAt:time(record.capturedAt),status:{mcpIsError:false,success:true,code:200,serverDatetime:str(response.datetime||''),traceRef:str(response.traceId?.slice(0,8)||'')},data:dataFor(tool,response.data)};
}
export function validateSnapshot(value, project) {
  obj(value);
  if(value.schemaVersion!==2 || value.project!==project || value.mode!=='snapshot' || value.source!=='authorized-host-mcp') fail();
  const records=list(value.records,r=>{
    obj(r); obj(r.status);
    if(r.status.mcpIsError!==false || r.status.success!==true || r.status.code!==200) fail();
    if(!PROJECT_TOOLS[project]?.includes(r.tool)) fail();
    return {tool:r.tool,args:argsFor(r.tool,r.args),capturedAt:time(r.capturedAt),status:pick(r.status,{mcpIsError:bool,success:bool,code:num,serverDatetime:str,traceRef:str}),data:dataFor(r.tool,r.data)};
  },20);
  if(!records.length || new Set(records.map(r=>r.tool)).size!==records.length) fail();
  const find=t=>records.find(r=>r.tool===t);
  if(project==='order' && find('query_meals')) {
    const menu=find('query_meals'),stores=find('query_nearby_stores');
    if(!stores || !stores.data.some(s=>s.storeCode===menu.args.storeCode)) fail();
  }
  if(project==='order' && find('calculate_price')) {
    const quote=find('calculate_price'),menu=find('query_meals');
    if(!menu || quote.args.storeCode!==menu.args.storeCode || quote.args.items.some(x=>!Object.hasOwn(menu.data.meals,x.productCode))) fail();
    if(quote.data.productList.length!==quote.args.items.length || quote.data.productList.some(p=>!quote.args.items.some(x=>x.productCode===p.productCode&&x.quantity===p.quantity))) fail();
  }
  if(project==='party' && find('query_party_store_session')) {
    const s=find('query_party_store_session'),d=find('query_party_store_date'),stores=find('query_party_store'),cities=find('query_party_city'),products=find('mall_points_products');
    if(!d||!stores||!cities||!products||!products.data.some(p=>p.spuId===s.args.spuId)||[d,stores,cities].some(r=>r.args.spuId!==s.args.spuId)||!cities.data.some(c=>String(c.code)===stores.args.code)||!stores.data.some(x=>x.code===s.args.storeCode)||d.args.storeCode!==s.args.storeCode||!d.data.some(x=>x.date===s.args.dateStr&&x.storeCode===s.args.storeCode)) fail();
  }
  return {schemaVersion:2,project,mode:'snapshot',source:'authorized-host-mcp',capturedAt:time(value.capturedAt),records};
}
export function normalizeHostBundle(bundle, project) {
  return validateSnapshot({schemaVersion:2,project,mode:'snapshot',source:'authorized-host-mcp',capturedAt:bundle.capturedAt,records:list(bundle.records,r=>normalizeHostRecord(project,r),20)},project);
}
