import bundled from './snapshot.js';
import {validateSnapshot} from './readonly-core.js';
const project=bundled.project;
const host=document.createElement('details');host.id='r2-data';
const summary=document.createElement('summary');
summary.append(document.createTextNode('官方公开资料参考'));
const badge=document.createElement('span');badge.className='r2-badge';badge.textContent='时间戳快照 · 非实时';summary.append(badge);host.append(summary);
const content=document.createElement('div');host.append(content);document.body.append(host);
let current=null,origin='本包随附采集结果',importSequence=0;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const labels={campaign_calendar:'官方活动',query_nearby_stores:'上海示例门店',query_meals:'门店菜单',calculate_price:'单品报价',mall_points_products:'官方派对商品',query_party_city:'城市目录',query_party_store:'上海派对门店',query_party_store_date:'示例门店日期',query_party_store_session:'示例门店场次'};
const notices={order:'以下是官方查询快照。本页购物车、会员权益和奖励仍为本地演示，未使用本快照结算。菜单可能包含条件优惠；单品报价仅适用于采集时的门店、商品和数量。',party:'随附历史快照中的官方目录为儿童主题生日商品，仅作可查询能力参考；不代表成人生日方案适用或门店承诺。本页成人聚会预算、菜单与流程继续为本地策划。未创建预订、未锁定场次。',games:'这里展示历史公开活动查询快照。游戏每局 88 演示积分、胜利奖励和券包均为本地模拟。35 个工具中未公开自定义游戏扣分或自定义券发行接口，官方抽奖和商城兑换不能替代这些能力。'};
function render(){
  content.replaceChildren();content.append(el('p',notices[project],'r2-notice'));
  const freshness=el('p',`${origin} · 采集 ${current.capturedAt}（UTC） · 各查询采集时间见下方。数据不会自动刷新，场次与价格可能变化。`,'r2-status');content.append(freshness);
  const controls=el('div',undefined,'r2-controls');const label=el('label','查看内容 ');const select=el('select');select.setAttribute('aria-label','真实查询内容');
  for(const r of current.records){const op=el('option',labels[r.tool]);op.value=r.tool;select.append(op);}label.append(select);controls.append(label);
  const importLabel=el('label','导入宿主快照 ');const file=el('input');file.type='file';file.accept='.json,application/json';file.setAttribute('aria-label','导入宿主快照');importLabel.append(file);controls.append(importLabel);
  const reset=el('button','恢复随附快照');reset.type='button';controls.append(reset);content.append(controls);
  const feedback=el('p','导入文件仅做结构与业务状态校验，不能验证来源真伪；请仅导入可信宿主的公开查询结果。','r2-status');feedback.setAttribute('role','status');feedback.id='r2-feedback';content.append(feedback);
  const info=el('p',undefined,'r2-status');const search=el('input');search.type='search';search.placeholder='筛选已采集的公开数据';search.setAttribute('aria-label','筛选快照数据');content.append(search,info);
  const rows=el('div',undefined,'r2-scroll');rows.id='r2-results';content.append(rows);
  const evidence=el('details');evidence.append(el('summary','查看去敏调用证据'));const pre=el('pre');evidence.append(pre);content.append(evidence);
  function update(){
    const r=current.records.find(x=>x.tool===select.value);const q=search.value.trim().toLowerCase();
    info.textContent=`${labels[r.tool]} · 采集 ${r.capturedAt} · MCP isError=false / success=true / code=200`;
    rows.replaceChildren();
    const add=(title,description,meta)=>{if(q&&!`${title} ${description} ${meta}`.toLowerCase().includes(q))return;const card=el('article');card.append(el('h3',title),el('p',description),el('small',meta));rows.append(card);};
    const d=r.data;
    if(r.tool==='campaign_calendar') for(const day of d.dailyList) for(const event of day.events)add(event.title||'未提供标题',event.description,`${day.date}${day.today?' · 采集时当天':''} · 活动类型 ${event.eventType} · 活动文案不是可用券或成交承诺`);
    if(r.tool==='query_nearby_stores') for(const s of d)add(s.storeName,`${s.address}\n营业：${s.businessStartTime}–${s.businessEndTime} · 采集时${s.businessStatus?'营业':'暂停营业'}\n${s.reservationTimeOptions.map(x=>`${x.date}${x.today?'（采集时今天）':''}：${x.reservationOptionText}`).join('\n')}`,`storeCode ${s.storeCode} · 到店自取无 beCode · 相对公开示例地点距离 ${s.distance}m，非用户位置 · 支持预约 ${s.reservation}`);
    if(r.tool==='query_meals') for(const [code,m] of Object.entries(d.meals))add(m.name,`菜单现价字段：${m.currentPrice} · 原价字段：${m.originalPrice??'未返回'}${m.discountType?' · 条件：'+m.discountType:''}`,`商品 ${code} · 门店 ${r.args.storeCode} · 到店自取 · 仅参考，未校验当前购买资格`);
    if(r.tool==='calculate_price'){for(const p of d.productList)add(p.productName,`数量 ${p.quantity} · 小计 ¥${(p.subtotal/100).toFixed(2)}（接口单位分）`,`商品 ${p.productCode} · 门店 ${r.args.storeCode}`);add('采集时报价合计',`¥${(d.price/100).toFixed(2)} · 原价 ${d.originalPrice===undefined?'未返回':'¥'+(d.originalPrice/100).toFixed(2)} · 本次优惠 ${d.discount===undefined?'未返回':'¥'+(d.discount/100).toFixed(2)}`,'只读试算，未付款、未下单；未将未享优惠或未来奖励减入本次金额');}
    if(r.tool==='mall_points_products')for(const p of d)add(p.spuName,`所需积分 ${p.point} · 金额字段 ${p.price}\n${p.selling}\n上架 ${p.upTime} · 下架 ${p.downTime}`,`SPU ${p.spuId} · shopId ${p.shopId} · 类目 ${p.catName} · 状态 ${p.status} · 商品图片未打包，完整原始价格单位未由 schema 声明`);
    if(r.tool==='query_party_city')for(const c of d)add(c.name,`城市 code ${c.code}`,`公开城市参考坐标 ${c.latitude}, ${c.longitude} · SPU ${r.args.spuId} · 非用户位置`);
    if(r.tool==='query_party_store')for(const s of d)add(s.name,s.address,`storeCode ${s.code} · 城市 ${s.cityName} (${s.cityCode}) · SPU ${r.args.spuId}`);
    if(r.tool==='query_party_store_date')for(const x of d)add(x.date,'采集时可查询日期；未锁定名额',`storeCode ${x.storeCode} · SPU ${r.args.spuId}`);
    if(r.tool==='query_party_store_session')for(const s of d)add(`${s.timeStart}–${s.timeEnd}`,`采集时剩余 ${s.leftNum} · 最少 ${s.partyMin} / 最多 ${s.partyMax} 人\n接口价格原值 ${s.price}（单位未明确，未换算成人套餐价格）`,`场次 ${s.id} · ${r.args.dateStr} · storeCode ${r.args.storeCode} · SPU ${r.args.spuId} · 未预约`);
    if(!rows.childElementCount) rows.append(el('p',q?'没有匹配的已采集数据':'接口返回空列表；不表示查询失败','r2-empty'));
    pre.textContent=JSON.stringify({tool:r.tool,args:r.args,capturedAt:r.capturedAt,...r.status,transport:'宿主未暴露底层 HTTP/JSON-RPC 状态，未独立断言'},null,2);
  }
  select.onchange=()=>{search.value='';update();};search.oninput=update;
  reset.onclick=()=>{importSequence++;current=validateSnapshot(bundled,project);origin='本包随附采集结果';render();};
  file.onchange=async()=>{const attempt=++importSequence;feedback.textContent='正在校验导入文件…';feedback.className='r2-status';try{const f=file.files[0];if(!f||f.size>2*1024*1024)throw Error('文件缺失或超过 2MB');const next=validateSnapshot(JSON.parse(await f.text()),project);if(attempt!==importSequence)return;current=next;origin='用户导入 · 来源真实性未独立核验';render();}catch{if(attempt!==importSequence)return;feedback.textContent='导入失败：格式、项目或业务状态不符合要求；当前数据保持不变。';feedback.className='r2-error';}};
  update();
}
try{current=validateSnapshot(bundled,project);render();}catch{content.append(el('p','随附真实快照未通过校验；真实查询展示不可用。下方演示保持独立。','r2-error'));}
