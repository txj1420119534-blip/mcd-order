import {MENU,THEMES,getTheme,themeAgenda,fresh,validate,totals,coverage,changeQuantity,recommend,trimExtras,agendaErrors,planReadiness,save,restore,shareText} from './core.js';
import {themeImage,agendaClock} from './presentation.js';

let state;
let storageAvailable = true;
try { state = restore(localStorage); } catch { state = fresh(); storageAvailable = false; }
const stores = {'上海':['静安灵感店','浦东好时光店'],'北京':['朝阳相聚店','海淀灵感店'],'广州':['天河好时光店','越秀相聚店']};
const sessions = ['午间 12:00–14:00','下午 14:00–16:00','晚间 18:00–20:00'];
const stepNames = ['选个主题','搭配餐单','安排流程','我的方案'];
const nextNames = ['选好啦，搭配餐单','下一步，安排流程','生成我的方案','保存方案卡'];
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => Number(n).toLocaleString('zh-CN',{minimumFractionDigits:0,maximumFractionDigits:2});
const options = (items,value) => items.map(x=>`<option ${x===value?'selected':''}>${esc(x)}</option>`).join('');

function foodArt(id) {
  if (id === 'tea') return '<img class="menu-photo tea-photo" src="assets/party-tea-v2.png" alt="无糖茶饮概念图">';
  return `<span class="menu-photo food-${id}" role="img" aria-label="${esc(MENU.find(m=>m.id===id)?.name||'餐品')}概念图"></span>`;
}
function persist() {
  try { save(localStorage,state); storageAvailable = true; }
  catch { storageAvailable = false; }
}
function notify(text) {
  const node = document.querySelector('#toast');
  node.textContent = text; node.classList.add('visible');
  clearTimeout(window.partyToastTimer);
  window.partyToastTimer = setTimeout(()=>node.classList.remove('visible'),4200);
}
function focusKey() {
  const el = document.activeElement;
  if (!el || !document.querySelector('#app').contains(el)) return '';
  if (el.id) return '#'+CSS.escape(el.id);
  for (const key of ['quantity','quick','theme','step']) if (el.dataset[key]) {
    const extra = key==='quantity' ? `[data-delta="${el.dataset.delta}"]` : key==='quick' ? `[data-value="${el.dataset.value}"]` : '';
    return `[data-${key}="${el.dataset[key]}"]${extra}`;
  }
  return '';
}
function setStep(step) {
  if (step===3 && agendaErrors(state.agenda).length) { notify(agendaErrors(state.agenda)[0]); return; }
  state.step = step; persist(); render();
  document.querySelector('#workspace').scrollIntoView({behavior:'smooth',block:'start'});
  document.querySelector('.editor-head h2').focus({preventScroll:true});
}
function render() {
  const restoreFocus = focusKey();
  const t = totals(state), theme = getTheme(state.theme);
  document.querySelector('#app').innerHTML = `
    <header class="site-header">
      <a href="index.html" class="brand" aria-label="麦麦派对首页"><b>麦麦<span>派对</span></b><small>快乐，就要一起</small></a>
      <nav aria-label="主导航"><a class="nav-active" href="#workspace">聚会策划</a><button data-step="3" class="navlink">我的方案</button><button id="about" class="navlink">怎么玩</button></nav>
      <span class="demo-pill">18+ · 演示</span>
    </header>
    <main>
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy"><span class="eyebrow">好朋友，好好聚。</span><h1 id="hero-title">快乐加倍，<br><span>一起开席。</span></h1><p>生日也好，想见面也好。<br>把喜欢的餐和人，安排在一起。</p><div class="hero-actions"><a class="primary hero-cta" href="#workspace">现在组个局 <span>→</span></a><button class="text-button" id="hero-guide">怎么玩</button></div><div class="hero-tags"><span>生日聚会</span><span>好友小聚</span><span>同好碰头</span></div></div>
        <div class="hero-art"><img src="${themeImage('birthday')}" alt="成年朋友在暖色快餐聚会空间庆祝生日的原创概念场景"><span class="art-bottom-note">AI 场景示意 · 非可订场地</span></div>
      </section>
      <section id="workspace" class="workspace" aria-label="聚会计划编辑器">
        <div class="workspace-heading"><div><span class="eyebrow">我的快乐计划</span><h2>这场聚会，你说了算。</h2></div><div class="workspace-tools"><span class="save-indicator">${storageAvailable?'已保存到本机':'仅本次保留'}</span><button data-reset class="text-button reset-button">重置计划</button></div></div>
        ${!storageAvailable?'<div class="storage-warning" role="status">草稿暂时无法保存到浏览器。仍可完整试玩，离开前请下载方案。</div>':''}
        <div class="studio">
          <nav class="steps" aria-label="策划步骤">${stepNames.map((name,i)=>`<button class="step ${state.step===i?'active':''} ${state.step>i?'completed':''}" data-step="${i}" aria-current="${state.step===i?'step':'false'}"><span class="step-number">${state.step>i?'✓':i+1}</span><span>${name}</span></button>`).join('')}</nav>
          <div class="editor">${state.step===0?preferences():state.step===1?meal():state.step===2?agenda():result()}</div>
          <aside class="summary" aria-label="当前方案摘要">${ticket(t,theme)}</aside>
        </div>
      </section>
      <details class="experience-notes"><summary>规则与数据来源 <span>独立创意 · 本地演示</span></summary><p>麦麦派对是面向 18 岁以上朋友的独立非官方创意工具。成人餐单、价格、地点与流程均为本地模拟；图片为 AI 原创概念图，不代表官方商品、实际份量或可订场地。未进行预约、付款或真实积分操作。</p><p>下方官方公开资料是保留采集时间的历史快照，不是当前价格、场次或可订承诺。官方儿童主题商品只适用于其原范围，不作为成人套餐展示。导入失败保留原快照，成功导入也不代表来源已独立核验。</p><p>预算仅计算演示餐饮，不含布置和交通。实际价格、配料、过敏原及聚会许可请向真实门店核实；减少肉类不等于完整素食。</p></details>
    </main>
    <footer><a class="brand footer-brand" href="index.html"><b>麦麦<span>派对</span></b></a><span>独立非官方创意试玩 · 无真实预订</span><button data-reset class="text-button">重新开始</button></footer>
    <div class="mobile-plan-bar"><div><small>演示餐单合计</small><strong>¥${money(t.total)}</strong><span>${state.people} 人 · 人均 ¥${t.perPerson.toFixed(2)}</span></div><button class="primary" data-mobile-next>${state.step===3?'保存方案':'下一步'} <span>→</span></button></div>`;
  bind();
  if (restoreFocus) document.querySelector(restoreFocus)?.focus({preventScroll:true});
}
function ticket(t, theme) {
  const over = t.remaining < 0;
  return `<div class="ticket"><div class="ticket-top"><span>聚会清单</span><span class="small-demo">演示</span></div><img class="ticket-image" src="${themeImage(state.theme)}" alt="${theme.name}原创场景示意"><div class="ticket-main"><h3>${theme.name}</h3><p class="ticket-date">${state.date?esc(state.date):'日期待定'} · ${esc(state.time)}</p><div class="summary-line"><span>聚会人数</span><strong>${state.people} 位成年人</strong></div><div class="summary-line"><span>人均预算</span><strong>¥${money(state.budget)}</strong></div><div class="ticket-amount"><span>餐单合计</span><strong><small>¥</small>${money(t.total)}</strong></div><div class="summary-line"><span>平均每人</span><strong>¥${t.perPerson.toFixed(2)}</strong></div><div class="budget-track ${over?'over':''}" role="img" aria-label="已使用预算 ${Math.round(t.total/t.limit*100)}%"><i style="width:${Math.min(100,t.total/t.limit*100)}%"></i></div><p class="budget-note ${over?'over':''}">${over?'超预算 ¥'+money(-t.remaining):'预算还余 ¥'+money(t.remaining)}</p></div><div class="ticket-bottom">方案随时可改，完成后可下载。</div></div>`;
}
function preferences() {
  return `<div class="editor-head"><span class="chapter">01 / 选主题</span><h2 tabindex="-1">今天，怎么个快乐法？</h2><p>挑个喜欢的，再定人数和预算。</p></div>
    <div class="theme-grid">${THEMES.map(t=>`<button class="theme ${state.theme===t.id?'selected':''}" data-theme="${t.id}" aria-pressed="${state.theme===t.id}"><span class="theme-art"><img src="${themeImage(t.id)}" alt="${t.name}原创场景概念图"></span><span class="theme-label"><strong>${t.name}</strong><small>${t.tag}</small></span><i aria-hidden="true">${state.theme===t.id?'✓':'+'}</i></button>`).join('')}</div>
    <div class="fields"><div class="field"><label for="people">几个人一起？</label><div class="number-field"><input id="people" type="number" min="2" max="30" value="${state.people}"><span>人</span></div><div class="quick-options">${[4,6,8,12].map(n=>`<button data-quick="people" data-value="${n}" aria-pressed="${state.people===n}" class="${state.people===n?'selected':''}">${n} 人</button>`).join('')}</div><small>2–30 位成年人</small></div>
    <div class="field"><label for="budget">人均预算</label><div class="number-field"><span>¥</span><input id="budget" type="number" min="20" max="500" value="${state.budget}"><span>/ 人</span></div><div class="quick-options">${[50,75,100].map(n=>`<button data-quick="budget" data-value="${n}" aria-pressed="${state.budget===n}" class="${state.budget===n?'selected':''}">¥${n}</button>`).join('')}</div><small>演示餐饮预算</small></div>
    <label>哪天见面<input id="date" type="date" value="${esc(state.date)}"><small>可以先留空</small></label><label>几点开始<input id="time" type="time" value="${esc(state.time)}"></label></div>
    <details class="location-box"><summary><span>碰头地点</span><small>${esc(state.city)} · 演示地点</small></summary><div class="location-fields"><label>城市<select id="city">${options(Object.keys(stores),state.city)}</select></label><label>灵感门店<select id="store">${options(stores[state.city]||stores['上海'],state.store)}</select></label></div><label>演示时段<select id="session">${options(sessions,state.session)}</select></label><p>仅记录虚构灵感地点，不锁定门店或时段。</p></details>
    ${actions(0)}`;
}
function actions(step) {
  return `<div class="editor-actions">${step>0?`<button class="text-button" data-step="${step-1}">← 上一步</button>`:'<span class="step-hint">计划随时可以调整</span>'}<button class="primary" id="next">${nextNames[step]} <span>→</span></button></div>`;
}
function meal() {
  const c = coverage(state), t = totals(state);
  return `<div class="editor-head"><span class="chapter">02 / 搭餐单</span><h2 tabindex="-1">喜欢的，一起分享。</h2><p>${state.people} 位朋友的餐单 · 演示价格</p></div>
    <div class="diet-row"><label>搭配偏好<select id="diet">${[['regular','经典一起吃'],['lesssugar','少甜饮与甜点'],['lessmeat','减少肉类份数']].map(([v,label])=>`<option value="${v}" ${state.diet===v?'selected':''}>${label}</option>`).join('')}</select></label><button class="secondary" id="recommend">按人数配一份</button></div>
    <div class="coverage-row"><span class="${c.mainMissing?'warning':''}">主食 <b>${c.main}</b> / ${state.people} 人</span><span class="${c.drinksMissing?'warning':''}">饮品 <b>${c.drinks}</b> / ${state.people} 人</span><span class="art-hint">AI 餐品示意</span></div>
    <div class="menu-list">${MENU.map(m=>`<div class="menu-item"><div class="food-icon">${foodArt(m.id)}</div><div class="food-detail"><b>${m.name}</b><small>${m.tag}</small><strong><span>¥</span>${m.price}</strong></div><div class="quantity"><button data-quantity="${m.id}" data-delta="-1" aria-label="减少${m.name}" ${state.quantities[m.id]===0?'disabled':''}>−</button><output aria-label="${m.name}数量">${state.quantities[m.id]}</output><button data-quantity="${m.id}" data-delta="1" aria-label="增加${m.name}" ${state.quantities[m.id]===100?'disabled':''}>+</button></div></div>`).join('')}</div>
    ${t.remaining<0?`<div class="budget-alert"><div><b>比预算多了 ¥${money(-t.remaining)}</b><p>可减少小食和甜点，主食与饮品保留。</p></div><button id="trim-extras" class="secondary">帮我调整</button></div>`:''}
    <details class="meal-notes"><summary>份数与饮食提醒</summary><p>${c.mainMissing?'主食少于人数，请确认分享安排。':''}偏好不是过敏原筛选；减少肉类不等于完整素食。实际配料与饮食适用性请向门店核实。</p></details>${actions(1)}`;
}
function agenda() {
  return `<div class="editor-head"><span class="chapter">03 / 排流程</span><h2 tabindex="-1">好时光，安排上。</h2><p>四段小活动，改成你们喜欢的样子。</p></div>
    <div class="agenda-list">${state.agenda.map((a,i)=>`<div class="agenda-item"><span class="agenda-dot">${i+1}</span><div><div class="agenda-topline"><b class="actual-time">${agendaClock(state.time,a.time)}</b><label class="agenda-time">开始后 <input data-agenda="${i}" data-key="time" value="${esc(a.time)}" maxlength="5" aria-label="活动${i+1}相对时间" pattern="[0-9]{2}:[0-5][0-9]"></label></div><input class="agenda-title" data-agenda="${i}" data-key="title" value="${esc(a.title)}" maxlength="80" aria-label="活动${i+1}标题"><textarea data-agenda="${i}" data-key="detail" maxlength="500" aria-label="活动${i+1}说明">${esc(a.detail)}</textarea></div></div>`).join('')}</div>
    <button id="reset-agenda" class="text-button">恢复主题流程</button><p class="small-warning">活动自愿参加，留一点自由时间也很好。</p>${actions(2)}`;
}
function result() {
  const t = totals(state), theme = getTheme(state.theme), warnings = planReadiness(state);
  return `<div class="editor-head"><span class="chapter">04 / 我的方案</span><h2 tabindex="-1">快乐就位，就差你们。</h2><p>保存这份计划，和朋友一起商量。</p></div>
    <section class="result-card"><div class="result-art"><img src="${themeImage(theme.id)}" alt="${theme.name}原创场景示意"><span>AI 场景示意</span></div><div class="result-card-body"><span class="result-kicker">18+ 私人创意方案 · 演示</span><h3>${theme.name}</h3><div class="result-facts"><span><small>聚会日期</small><b>${state.date?esc(state.date):'一起商量'}</b></span><span><small>开始时间</small><b>${esc(state.time)}</b></span><span><small>聚会人数</small><b>${state.people} 人</b></span><span><small>演示餐饮人均</small><b>¥${t.perPerson.toFixed(2)}</b></span></div>
    <div class="result-section"><h4>一起吃点好的 <span>演示合计 ¥${money(t.total)}</span></h4><div class="result-menu">${MENU.filter(m=>state.quantities[m.id]).map(m=>`<div><span>${m.name} <b>× ${state.quantities[m.id]}</b></span><span>¥${m.price*state.quantities[m.id]}</span></div>`).join('')||'<p>餐单还空着，先添加想吃的吧。</p>'}</div></div>
    <div class="result-section"><h4>聚会时间表</h4><div class="result-agenda">${state.agenda.map(a=>`<div><time>${agendaClock(state.time,a.time)}</time><span><b>${esc(a.title)}</b><p>${esc(a.detail)}</p></span></div>`).join('')}</div></div>
    <div class="result-location">灵感地点：${esc(state.city)} · ${esc(state.store)}<small>虚构地点 · 未预约</small></div><p class="result-stamp">独立非官方方案 · 不代表预订或付款</p></div></section>
    ${warnings.length?`<div class="result-warnings"><b>还有几件事，确认一下</b><ul>${warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></div>`:''}
    <div class="share-box"><h3>把快乐计划带走</h3><div><button id="export-card" class="primary">保存方案卡</button><button id="export" class="secondary">下载文字计划</button></div><details><summary>更多保存方式</summary><button id="export-json" class="text-button">下载 JSON 草稿</button></details><p>文件保存到本机，由你决定是否分享。</p></div>
    <div class="editor-actions"><button class="text-button" data-step="2">← 再改改流程</button><button data-reset class="text-button">开始新的一局</button></div>`;
}
function openDialog(id, content, className='guide-dialog') {
  document.getElementById(id)?.remove();
  const opener = document.activeElement, dialog = document.createElement('dialog');
  dialog.id = id; dialog.className = className;
  dialog.innerHTML = content; document.body.append(dialog);
  dialog.setAttribute('aria-labelledby',id+'-title');
  dialog.querySelectorAll('[data-close-dialog]').forEach(button=>button.onclick=()=>dialog.close());
  dialog.addEventListener('click',event=>{
    if (event.target!==dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) dialog.close();
  });
  dialog.addEventListener('close',()=>{dialog.remove();if(opener?.isConnected)opener.focus();},{once:true});
  dialog.showModal(); return dialog;
}
function confirmAction(title, body, label, action) {
  const dialog = openDialog('action-dialog',`<button class="dialog-close" data-close-dialog aria-label="关闭确认">×</button><span class="dialog-kicker">我的聚会计划</span><h2 id="action-dialog-title">${esc(title)}</h2><p>${esc(body)}</p><div class="dialog-actions"><button class="secondary" id="action-cancel" data-close-dialog>先不改</button><button class="primary" id="action-confirm">${esc(label)}</button></div>`,'action-dialog');
  dialog.querySelector('#action-confirm').onclick = ()=>{dialog.close();action();};
}
function showGuide() {
  const dialog = openDialog('guide','<button class="dialog-close" data-close-dialog aria-label="关闭上手引导">×</button><span class="dialog-kicker">30 秒上手</span><h2 id="guide-title">组个局，很简单。</h2><ol><li><b>选主题，定人数与预算</b><p>日期没定也没关系。</p></li><li><b>挑餐品，安排小活动</b><p>推荐餐单可以自由增减。</p></li><li><b>保存方案，和朋友商量</b><p>草稿留在本机，随时回来改。</p></li></ol><button class="primary guide-start">开始组局</button><p class="guide-note">18+ 创意试玩 · 不预订、不付款</p>');
  dialog.querySelector('.guide-start').onclick=()=>{dialog.close();document.querySelector('#workspace').scrollIntoView({behavior:'smooth'});};
}
function updateField(id, value) {
  const next = {...state,[id]:['people','budget'].includes(id)?Number(value):value}, errors = validate(next);
  if (errors.length) { notify(errors[0]); render(); return; }
  if (id==='time'&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) { notify('请选择有效的开始时间'); render(); return; }
  state=next;
  if (id==='city') state.store=stores[state.city][0];
  if (id==='session') state.time=state.session.startsWith('午间')?'12:00':state.session.startsWith('下午')?'14:00':'18:00';
  persist(); render();
  if (id==='people') notify('人数已更新，餐单保留。第二步可按人数重新搭配。');
}
function bind() {
  document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>setStep(Number(b.dataset.step)));
  document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{
    if (state.theme===b.dataset.theme) return;
    confirmAction('换个主题？','活动流程将换成这个主题的推荐安排，餐单和预算保留。','换成这个',()=>{state.theme=b.dataset.theme;state.agenda=themeAgenda(state.theme);persist();render();notify('主题已更新');});
  });
  document.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>updateField(b.dataset.quick,b.dataset.value));
  for(const id of ['date','time','people','budget','city','store','session','diet']) {
    const el=document.getElementById(id);if(el)el.onchange=()=>updateField(id,el.value);
  }
  document.querySelectorAll('[data-quantity]').forEach(b=>b.onclick=()=>{state=changeQuantity(state,b.dataset.quantity,Number(b.dataset.delta));persist();render();});
  document.querySelectorAll('[data-agenda]').forEach(el=>el.onchange=()=>{
    const index=Number(el.dataset.agenda),key=el.dataset.key,value=el.value.trim();
    const next=structuredClone(state.agenda);next[index][key]=value;const errors=agendaErrors(next);
    if(errors.length){notify(errors[0]);el.value=state.agenda[index][key];return;}
    state.agenda=next;persist();
    if(key==='time')el.closest('.agenda-item').querySelector('.actual-time').textContent=agendaClock(state.time,value);
  });
  const next=document.querySelector('#next');if(next)next.onclick=()=>setStep(state.step+1);
  document.querySelector('[data-mobile-next]').onclick=()=>state.step<3?setStep(state.step+1):document.querySelector('#export-card').click();
  const rec=document.querySelector('#recommend');if(rec)rec.onclick=()=>confirmAction('重新搭配餐单？',`按 ${state.people} 人和当前偏好重新推荐，将替换现有份数。`,'重新搭配',()=>{state=recommend(state);persist();render();notify('餐单已更新，还可以自由调整。');});
  const trim=document.querySelector('#trim-extras');if(trim)trim.onclick=()=>{
    state=trimExtras(state);persist();render();notify(totals(state).remaining<0?'已减少可选小食，主食和饮品保留。餐单仍超预算。':'已调整小食，餐单回到预算内。');
  };
  const resetAgenda=document.querySelector('#reset-agenda');if(resetAgenda)resetAgenda.onclick=()=>confirmAction('恢复主题流程？','你编辑的四段活动将替换为主题推荐流程。','恢复流程',()=>{state.agenda=themeAgenda(state.theme);persist();render();notify('主题流程已恢复');});
  document.querySelectorAll('[data-reset]').forEach(b=>b.onclick=()=>confirmAction('重新组个局？','当前计划会重置，已下载的文件保留。','重置计划',()=>{state=fresh();persist();render();notify('计划已重置');}));
  document.querySelector('#about').onclick=showGuide;document.querySelector('#hero-guide').onclick=showGuide;
  const ex=document.querySelector('#export');if(ex)ex.onclick=()=>download(shareText(state),'快乐组局计划.txt','text/plain;charset=utf-8');
  const card=document.querySelector('#export-card');if(card)card.onclick=()=>download(planCardDocument(),'快乐组局方案卡.html','text/html;charset=utf-8');
  const json=document.querySelector('#export-json');if(json)json.onclick=()=>download(JSON.stringify({kind:'independent-demonstration-plan',version:1,notice:'Non-official adult creative plan. Demo catalog, prices, store and session. No booking.',plan:state,totals:totals(state)},null,2),'快乐组局计划.json','application/json');
}
function planCardDocument() {
  const theme=getTheme(state.theme),t=totals(state);
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(theme.name)} · 麦麦派对</title><style>*{box-sizing:border-box}body{margin:0;padding:32px 18px;background:#f6f6f6;color:#252525;font:16px/1.8 system-ui,"Microsoft YaHei",sans-serif}main{max-width:760px;margin:auto;background:#fff;overflow:hidden;border-radius:20px}.hero{padding:36px;background:#ffc72c}h1{font-size:42px;margin:12px 0}h2{font-size:20px;margin:28px 0 12px}.body{padding:32px}.facts{display:flex;gap:20px;flex-wrap:wrap}.facts span{padding:12px 18px;background:#fff;border-radius:8px}.menu{padding:12px 0;border-bottom:1px solid #eee;display:flex;justify-content:space-between}.agenda{display:flex;gap:18px;margin:20px 0}.agenda time{color:#c62027;font-weight:bold;white-space:nowrap}.agenda p{margin:4px 0;color:#555}.note{padding:18px;background:#fff8e5;border-radius:8px;font-size:13px}.brand{font-size:14px;font-weight:700}small{color:#666}@media print{body{padding:0;background:white}main{border:0}.hero{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style><main><div class="hero"><div class="brand">麦麦派对 · 快乐，就要一起</div><h1>${theme.name}</h1><div class="facts"><span>${state.people} 位成年人</span><span>${state.date?esc(state.date):'日期待定'} · ${esc(state.time)}</span><span>演示人均 ¥${t.perPerson.toFixed(2)}</span></div></div><div class="body"><h2>一起吃点好的 <small>演示合计 ¥${money(t.total)}</small></h2>${MENU.filter(m=>state.quantities[m.id]).map(m=>`<div class="menu"><span>${m.name} × ${state.quantities[m.id]}</span><b>¥${m.price*state.quantities[m.id]}</b></div>`).join('')}<h2>聚会时间表</h2>${state.agenda.map(a=>`<div class="agenda"><time>${agendaClock(state.time,a.time)}</time><div><b>${esc(a.title)}</b><p>${esc(a.detail)}</p></div></div>`).join('')}<p>灵感地点：${esc(state.city)} / ${esc(state.store)} / ${esc(state.session)}（虚构演示）</p><div class="note">18+ 私人创意计划 · 独立非官方 · 餐品与价格为演示。${t.remaining<0?'餐单超预算 ¥'+money(-t.remaining)+'。':''}本文件不代表预订、付款、可售套餐或场次承诺。实际价格、配料、过敏原和聚会许可需向真实门店确认。官方儿童主题商品不构成成人方案适用证明。</div></div></main></html>`;
}
function download(data,name,type) {
  try {
    const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');
    a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);notify('已生成下载文件');
  } catch {notify('当前浏览器无法下载，请保留页面或更换浏览器。');}
}
persist();render();
