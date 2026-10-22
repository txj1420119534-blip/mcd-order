import {products,stores,locations,coupons,task} from './fixtures.js';
import {money,quote,suggestions,settle} from './rules.js';
import {initial,restore} from './storage.js';
import {categories,matchingProducts,nextOrderId} from './view-model.js';
import {displayProductName,rewardProgress,memberProgress,cartReminder} from './experience.js';

const storageKey='mcd-order-demo-v2';
let state=structuredClone(initial),storageIssue='',restoreWarning='',raw;
try { raw=localStorage.getItem(storageKey); }
catch { storageIssue='当前使用临时体验模式，刷新后不保留记录。'; }
if(raw)try { state=restore(raw); } catch { restoreWarning='上次餐单无法读取，已恢复初始餐单。'; }
let currentSheet=null,returnFocusId='',toastTimer,automaticReminderShown=false;
const app=document.querySelector('#app');
const sheet=document.createElement('dialog');
sheet.id='order-sheet';sheet.setAttribute('aria-labelledby','sheet-title');
document.body.append(sheet);
const tileIndex={meal30:0,meal37:1,dessert:2,bigmac:3,chicken:4,fries:5,nuggets:6,cola:7,coffee:8};
const memberNames={guest:'游客体验',member:'普通会员',gold:'金卡会员',plus:'PLUS 会员'};
const options=(items,value)=>items.map(item=>`<option value="${item.id}" ${value===item.id?'selected':''}>${item.name}</option>`).join('');
const countItems=()=>Object.values(state.cart).reduce((a,b)=>a+b,0);
const name=displayProductName;

function persist(){
 if(storageIssue)return;
 try { localStorage.setItem(storageKey,JSON.stringify(state)); }
 catch { storageIssue='记录暂时无法保存，当前餐单仍可继续体验。'; }
}
function toast(message){
 const node=document.querySelector('#toast');node.textContent=message;node.classList.add('show');
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('show'),2600);
}
function foodPhoto(product,extra=''){
 return `<div class="food-photo tile-${tileIndex[product.id]} ${extra}" role="img" aria-label="${name(product)}，AI 餐品示意图"></div>`;
}
function taskCopy(q){
 const progress=rewardProgress(state,q);
 if(progress.kind==='unavailable')return {title:'先检查取餐设置',detail:'恢复报价后查看任务',button:'查看任务'};
 if(progress.kind==='guest')return {title:'满 ¥28，得下次甜点券',detail:'会员任务 · 可切换体验身份',button:'看看任务'};
 if(progress.kind==='unclaimed')return {title:progress.gap?'领任务，再享甜点券':'这单可得下次甜点券',detail:progress.gap?`先领取 · 餐品实付还差 ${money(progress.gap)} 满 ¥28`:'餐品实付已满 ¥28，先领任务再下单',button:'领任务'};
 if(progress.kind==='pending')return {title:`再点 ${money(progress.gap)}，任务就达标`,detail:'已领取 · 按优惠后餐品实付计算',button:'看进度'};
 return {title:'这单达标啦，甜点券等你拿',detail:'已领取 · 完成后记入下次奖励',button:'看奖励'};
}
function perkLine(q){
 const member=memberProgress(state,q);
 if(member.kind==='applied')return `本单已享金卡减 ${money(member.saving)}`;
 if(member.kind==='pending')return `再点 ${money(member.gap)}，可享金卡满 ¥39 减 ¥5`;
 return '商品券与会员优惠，结算前看清楚';
}
function productCard(product){
 const qty=state.cart[product.id]||0;
 return `<article class="product ${qty?'is-selected':''}" data-product="${product.id}">
  <button class="product-visual" data-product-open="${product.id}" aria-label="查看${name(product)}详情">${foodPhoto(product)}${qty?`<span class="selected-count">${qty}</span>`:''}</button>
  <div class="product-info"><button class="product-name" data-product-open="${product.id}"><h3>${name(product)}</h3></button><p>${product.contents||product.note}</p>
  <div class="product-bottom"><strong>${money(product.price)}</strong><button class="add-button" data-add="${product.id}" aria-label="添加${product.name}">＋</button></div></div>
 </article>`;
}
function cartLines(){
 return products.filter(product=>state.cart[product.id]>0).map(product=>`<div class="cart-line">
  ${foodPhoto(product,'cart-photo')}<div class="cart-product"><h3>${name(product)}</h3><small>${money(product.price)} / 份</small><div class="quantity"><button data-minus="${product.id}" aria-label="减少${product.name}">−</button><span aria-label="${product.name}数量">${state.cart[product.id]}</span><button data-add="${product.id}" aria-label="增加${product.name}">＋</button></div></div><strong>${money(product.price*state.cart[product.id])}</strong>
 </div>`).join('')||'<div class="empty-cart"><h3>先选点喜欢的</h3><p>点一下餐品旁的「＋」就加好了。</p><button data-example="meal30" class="yellow-button">来份轻松一餐</button></div>';
}
function bill(q,prefix=''){
 return `<div class="coupon-field"><label for="${prefix}coupon">商品券 <small>每单 1 张</small></label><select id="${prefix}coupon" data-field="couponId">${options(coupons,state.couponId)}</select>${q.ok&&state.couponId!=='none'&&!q.couponApplied?'<small class="warning-text">这张券暂不适用当前餐品</small>':''}</div>
 ${q.ok?`<dl class="totals"><div><dt>餐品小计</dt><dd>${money(q.subtotal)}</dd></div>${q.discount?`<div class="saving"><dt>商品券</dt><dd>−${money(q.discount)}</dd></div>`:''}${q.goldDiscount?`<div class="saving"><dt>金卡满减</dt><dd>−${money(q.goldDiscount)}</dd></div>`:''}${state.mode==='delivery'?`<div><dt>配送费</dt><dd>${money(q.deliveryFee)}</dd></div>${q.deliveryBenefit?`<div class="saving"><dt>PLUS 免配送</dt><dd>−${money(q.deliveryBenefit)}</dd></div>`:''}`:''}</dl><button class="perk-link" data-action="offers">${perkLine(q)} <span>›</span></button><div class="grand-total"><span>合计<small>模拟金额</small></span><strong>${money(q.payable)}</strong></div>`:`<div class="error" role="alert">${q.error}</div>`}`;
}
function cartPanel(q){
 const t=taskCopy(q),count=countItems();
 return `<div class="cart-heading"><h2>已选餐品 <span>${count}</span></h2><button data-action="clear-cart" id="clear-cart" class="text-button" ${!count?'disabled':''}>清空</button></div><div class="cart-lines">${cartLines()}</div>${bill(q)}<button class="cart-task" data-action="task"><span><strong>${t.title}</strong><small>下次甜点减 ¥3 · 不抵本单</small></span><b>›</b></button><button id="checkout" data-action="checkout" class="yellow-button checkout" ${!q.ok||!count?'disabled':''}>去结算 <span>›</span></button><p class="quiet-note">模拟体验，无需付款</p>`;
}
function ledgerRow(order){
 return `<article class="ledger-row"><div><strong>${order.id}</strong><small>模拟订单</small><p>${Object.entries(order.cart).map(([id,n])=>`${name(products.find(p=>p.id===id))} ×${n}`).join(' · ')}</p></div><div class="ledger-value"><strong>${money(order.quote.payable)}</strong><small>${order.reward?'1 张后续商品券':'未获得奖励'}</small><details><summary>订单详情</summary><p>${order.status}</p>${order.rewardCoupon?`<p>${order.rewardCoupon.name}</p><p>${order.rewardCoupon.condition}</p>`:'<p>任务未领取或餐品实付未达 ¥28。</p>'}</details></div></article>`;
}
function render(){
 persist();
 const focusedId=document.activeElement?.id,q=quote(state),count=countItems(),taskInfo=taskCopy(q);
 app.innerHTML=`<header class="topbar"><a class="brand" href="#menu" aria-label="麦麦点餐首页"><span class="brand-mark" aria-hidden="true">m</span><span>麦麦点餐</span></a><nav aria-label="主导航"><a href="#menu" class="active">点餐</a><a href="#ledger">我的订单</a><button data-action="guide">怎么玩</button></nav><span class="demo-pill">非官方试玩</span><button id="guide-open" data-action="guide" class="icon-button" aria-label="打开试玩指引">?</button></header>
 <main>
 <section class="storebar" aria-label="取餐设置"><div class="store-picker"><span class="store-label">当前门店 · 演示</span><select id="store" data-field="storeId" aria-label="选择演示门店">${options(stores,state.storeId)}</select></div><div class="segmented" aria-label="取餐方式"><button data-mode="pickup" aria-pressed="${state.mode==='pickup'}" class="${state.mode==='pickup'?'active':''}">到店自取</button><button data-mode="delivery" aria-pressed="${state.mode==='delivery'}" class="${state.mode==='delivery'?'active':''}">麦乐送体验</button></div><div class="member-picker"><label for="member">体验身份</label><select id="member" data-field="member"><option value="guest" ${state.member==='guest'?'selected':''}>游客</option><option value="member" ${state.member==='member'?'selected':''}>普通会员</option><option value="gold" ${state.member==='gold'?'selected':''}>金卡会员</option><option value="plus" ${state.member==='plus'?'selected':''}>PLUS 会员</option></select></div>
 ${state.mode==='delivery'?`<div class="delivery-picker"><label for="location">演示配送点</label><select id="location" data-field="locationId">${options(locations,state.locationId)}</select></div>`:''}</section>
 ${storageIssue?`<p id="storage-warning" class="storage-warning" role="status">${storageIssue}</p>`:''}${restoreWarning?`<p class="storage-warning" role="status">${restoreWarning}</p>`:''}
 <div class="ordering-layout"><div class="menu-column">
 <section class="promo" aria-label="今日点餐推荐"><img src="assets/order-hero.png" alt="汉堡、薯条与饮品的 AI 概念图，非商品实拍"><div class="promo-copy"><span class="promo-kicker">来点好滋味</span><h1>今天，就吃<br>这一口。</h1><button class="promo-link" data-product-open="meal30">轻松一餐 ¥30 <span>›</span></button></div><small class="image-disclaimer">AI 餐品示意</small></section>
 <section class="task-banner" id="benefits" aria-label="餐单任务"><div class="task-symbol" aria-hidden="true">¥3</div><div><strong>${taskInfo.title}</strong><p>${taskInfo.detail}</p></div><button id="claim" data-action="task">${taskInfo.button} <span>›</span></button></section>
 <section id="menu" class="menu" aria-labelledby="menu-title"><div class="menu-header"><h2 id="menu-title">选点好吃的</h2><label class="search"><span aria-hidden="true">⌕</span><input id="search" type="search" aria-label="搜索餐品" placeholder="搜索餐品" autocomplete="off"></label></div><div class="menu-body"><div class="tabs" role="group" aria-label="餐品分类">${categories.map(category=>`<button data-tab="${category}" aria-pressed="${state.tab===category}" class="${state.tab===category?'active':''}">${category==='全部'?'人气推荐':category}</button>`).join('')}</div><div class="menu-results"><div class="menu-meta"><p id="menu-result" role="status"></p><button id="clear-search" data-action="clear-filters" class="text-button" hidden>重置筛选</button></div><div class="product-grid">${products.map(productCard).join('')}</div><div id="no-results" class="no-results" hidden><h3>换个关键词试试</h3><button data-action="clear-filters" class="outline-button">看看全部餐品</button></div><p class="menu-footnote">餐品图片为 AI 示意 · 价格与优惠为本地演示</p></div></div></section>
 </div><aside class="cart" id="cart" aria-label="我的购物袋">${cartPanel(q)}</aside></div>
 <section id="ledger" class="ledger"><div class="section-heading"><h2>我的模拟订单</h2><button id="reset" data-action="reset" class="text-button">重置试玩</button></div>${state.ledger.length?state.ledger.map(ledgerRow).join(''):'<div class="ledger-empty">还没有订单，先来一餐喜欢的。</div>'}</section>
 <footer><span>麦麦点餐 · 独立创意试玩</span><div><button data-action="guide">试玩指引</button><button data-action="rules">规则与数据来源</button><button data-action="reset">一键重置</button></div></footer>
 </main><div class="mobile-bag"><button id="cart-toggle" data-action="cart" aria-label="查看购物袋"><span class="bag-count">${count}</span><span><strong>${q.ok?money(q.payable):'暂无法报价'}</strong><small>${q.ok&&(q.discount+q.goldDiscount+q.deliveryBenefit)?`本单已优惠 ${money(q.discount+q.goldDiscount+q.deliveryBenefit)}`:'模拟账单 · 无需付款'}</small></span></button><button id="mobile-checkout" data-action="checkout" class="yellow-button" ${!q.ok||!count?'disabled':''}>去结算 <b>›</b></button></div>`;
 document.querySelector('#search').value=state.search;
 filterProducts();
 if(currentSheet)renderSheet();
 const focusTarget=focusedId?document.getElementById(focusedId):null;
 if(focusTarget?.offsetParent!==null)focusTarget?.focus({preventScroll:true});
}
function filterProducts(){
 const ids=new Set(matchingProducts(state).map(product=>product.id));
 document.querySelectorAll('[data-product]').forEach(node=>node.hidden=!ids.has(node.dataset.product));
 document.querySelector('#no-results').hidden=ids.size>0;
 document.querySelector('#menu-result').textContent=state.search.trim()?`找到 ${ids.size} 款`:state.tab==='全部'?'热爱，每一口':state.tab;
 document.querySelector('#clear-search').hidden=!state.search&&state.tab==='全部';
}
function openSheet(type,data={}){
 returnFocusId=document.activeElement?.id||returnFocusId||'cart-toggle';
 currentSheet={type,...data};renderSheet();
}
function closeSheet(){
 currentSheet=null;
 if(sheet.open)sheet.close();
 document.body.classList.remove('has-sheet');
 document.getElementById(returnFocusId)?.focus({preventScroll:true});
}
function sheetFrame(title,body,kind=''){
 sheet.className=`order-sheet ${kind}`;
 sheet.innerHTML=`<div class="sheet-header"><h2 id="sheet-title">${title}</h2><button data-close class="sheet-close" aria-label="关闭弹窗">×</button></div><div class="sheet-body">${body}</div>`;
 if(!sheet.open){sheet.showModal();document.body.classList.add('has-sheet');}
}
function rewardTicket(){
 return `<div class="reward-ticket"><div><span>下次甜点券</span><strong><small>¥</small>3</strong></div><div><strong>香草甜点减 ¥3</strong><p>下次含香草甜点时用<br>每单限 1 张，不与其他商品券叠加</p><span class="simulation-tag">模拟奖励 · 本单不抵扣</span></div></div>`;
}
function taskBody(q){
 const progress=rewardProgress(state,q);
 if(!q.ok)return `<p class="error" role="alert">${q.error}</p><button class="yellow-button full-button" data-close>先调整取餐设置</button>`;
 const heading=progress.kind==='unclaimed'?(progress.gap?'先领任务，再慢慢选':'这单已满 ¥28，记得先领任务'):progress.kind==='guest'?'切换会员，体验领任务':progress.kind==='ready'?'本单已达标':'任务已领取';
 const detail=progress.kind==='pending'?`餐品实付还差 <strong>${money(progress.gap)}</strong> 满 ¥28`:progress.kind==='ready'?'完成这单，记入 1 张下次甜点券':progress.kind==='unclaimed'&&progress.gap?`优惠后餐品实付还差 <strong>${money(progress.gap)}</strong> 满 ¥28`:'在模拟下单前领取，完成后获得奖励';
 return `${rewardTicket()}<div class="task-status"><span class="small-label">满 ¥28 任务</span><h3>${heading}</h3><p>${detail}</p></div><div class="progress-track" role="progressbar" aria-label="任务进度" aria-valuemin="0" aria-valuemax="28" aria-valuenow="${Math.min(28,q.foodPaid/100)}"><span style="width:${Math.min(100,q.foodPaid/2800*100)}%"></span></div><div class="progress-values"><span>餐品实付 ${money(q.foodPaid)}</span><span>目标 ¥28</span></div><p class="fine-print">按全部优惠后的餐品实付计算，不含配送费。奖励是下次商品券，本单抵扣 ¥0.00。</p>${progress.kind==='pending'?'<button class="text-button full-button" data-action="offers">看看搭配，想吃再加 ›</button>':''}
 ${progress.kind==='guest'?'<button class="yellow-button full-button" data-action="member-demo">切换普通会员体验</button>':progress.canClaim?'<button id="claim-task" data-action="claim-task" class="yellow-button full-button">领取任务</button>':`<button class="yellow-button full-button" data-action="${currentSheet.returnTo==='checkout'?'checkout':'close'}">${currentSheet.returnTo==='checkout'?'返回结算':'继续点餐'}</button>`}
 <button class="text-button full-button" data-action="${currentSheet.returnTo==='checkout'?'checkout':'close'}">${progress.canClaim?'暂不参加，继续点餐':'按自己的胃口选，不必凑单'}</button>`;
}
function offersBody(q){
 if(!q.ok)return `<p class="error">${q.error}</p>`;
 const progress=memberProgress(state,q),plans=suggestions(state);
 const title=progress.kind==='applied'?`已享金卡减 ${money(progress.saving)}`:progress.kind==='pending'?`还差 ${money(progress.gap)}，可享满减`:'看看本单优惠';
 return `<div class="offer-heading"><span class="small-label">金卡满 ¥39 减 ¥5</span><h3>${title}</h3><p>门槛按商品券后的餐品金额计算，配送费不计入。</p></div><div class="offer-base"><span>当前门槛金额</span><strong>${money(q.memberEligibleBase)}</strong></div><div class="plan-list">${plans.map(plan=>`<article class="plan ${plan.id==='keep'?'keep-plan':''}"><div><strong>${plan.id==='keep'?'就吃这些':plan.title}</strong><p>${plan.description}</p><small>${plan.id==='keep'?'不增加消费':`比当前餐单${plan.increment>0?'多付':'少付'} ${money(Math.abs(plan.increment))}`}</small></div><div><b>${money(plan.quote.payable)}</b><button data-plan="${plan.id}" class="${plan.id==='keep'?'dark-button':'outline-button'}">${plan.id==='keep'?'保持原单':'选择搭配'}</button></div></article>`).join('')}</div><p class="fine-print">搭配金额已重新计算优惠。减 ¥5 不等于比原单少花 ¥5；想吃再加。</p>`;
}
function checkoutBody(q){
 const reward=rewardProgress(state,q),store=stores.find(item=>item.id===state.storeId);
 if(!q.ok||!countItems())return '<p class="error">当前餐单无法结算，请先检查取餐设置。</p><button data-close class="yellow-button full-button">返回点餐</button>';
 return `<div class="checkout-store"><span>${state.mode==='pickup'?'到店自取':'配送体验'}</span><strong>${store.name}</strong><small>${state.mode==='pickup'?'演示门店 · 不生成真实取餐号':'演示配送点 · 不发送配送订单'}</small></div><div class="checkout-items">${products.filter(p=>state.cart[p.id]).map(p=>`<div><span>${name(p)} ×${state.cart[p.id]}</span><strong>${money(p.price*state.cart[p.id])}</strong></div>`).join('')}</div>${bill(q,'sheet-')}
 <div class="checkout-reward"><div><span class="small-label">下次奖励</span><h3>${reward.kind==='unclaimed'?'这单的任务，还没领':reward.kind==='ready'?'完成后得甜点减 ¥3 券':reward.kind==='pending'?`距任务还差 ${money(reward.gap)}`:'本单未参加会员任务'}</h3><p>${reward.kind==='unclaimed'?(reward.gap?`先领取，餐品实付满 ¥28 才有奖励`:'本单已达标，领取后完成即可获得奖励'):reward.kind==='ready'?'记入下次奖励，本单不抵扣':'可以按当前餐单继续结算，不必加购。'}</p></div>${reward.canClaim?'<button id="claim-task" data-action="claim-task" class="dark-button">领取任务</button>':'<button data-action="task-from-checkout" class="text-button">查看规则 ›</button>'}</div><button id="confirm-checkout" data-action="confirm-checkout" class="yellow-button full-button">确认模拟下单 · ${money(q.payable)}</button><p class="quiet-note">仅生成本地记录，不付款、不发起真实订单</p><button data-close class="text-button full-button">继续选餐</button>`;
}
function renderSheet(){
 if(!currentSheet)return;
 const q=quote(state),{type}=currentSheet;
 if(type==='product'){
  const p=products.find(item=>item.id===currentSheet.productId);if(!p)return closeSheet();
  sheetFrame(name(p),`${foodPhoto(p,'detail-photo')}<div class="product-detail-copy"><span class="small-label">${p.contents?'一份套餐，刚刚好':p.category}</span><p>${p.contents||p.note}</p><div><strong>${money(p.price)}</strong><span>演示价格</span></div></div><button data-add="${p.id}" class="yellow-button full-button">加入餐单</button><p class="quiet-note">AI 餐品示意 · 真实规格以官方渠道为准</p>`,'product-sheet');return;
 }
 if(type==='task'){sheetFrame('领任务，享下次甜点券',taskBody(q),'task-sheet');return;}
 if(type==='offers'){sheetFrame('本单优惠',offersBody(q),'offers-sheet');return;}
 if(type==='cart'){sheetFrame(`已选 ${countItems()} 份餐品`,`<div class="cart-lines">${cartLines()}</div>${bill(q,'sheet-')}<button data-action="checkout" class="yellow-button full-button" ${!q.ok||!countItems()?'disabled':''}>去结算</button><button data-action="clear-cart" class="text-button full-button">清空餐单</button>`,'cart-sheet');return;}
 if(type==='checkout'){sheetFrame('确认这一餐',checkoutBody(q),'checkout-sheet');return;}
 if(type==='receipt'){
  const order=state.ledger.find(item=>item.id===currentSheet.orderId);if(!order)return closeSheet();
  sheetFrame('模拟下单完成',`<section id="receipt" class="receipt"><span class="receipt-check" aria-hidden="true">✓</span><h3>这一餐，安排好了</h3><p>${order.id} · 共 ${Object.values(order.cart).reduce((a,b)=>a+b,0)} 份餐品</p><div class="receipt-total"><span>模拟金额</span><strong>${money(order.quote.payable)}</strong></div><p class="receipt-safe">未付款，未发送真实订单</p>${order.reward?`${rewardTicket()}<p>已记入 1 张后续商品券。本单抵扣 ¥0.00。</p>`:`<div class="receipt-no-reward"><strong>本单未获得任务奖励</strong><p>${order.status}</p></div>`}<button id="continue-order" data-action="continue-order" class="yellow-button full-button">再来一餐</button><button data-action="show-ledger" class="text-button full-button">查看订单记录</button></section>`,'receipt-sheet');return;
 }
 if(type==='rules'){
  sheetFrame('规则与数据来源',`<div class="rules-copy"><h3>本单优惠</h3><p>商品券每单限 1 张。金卡与 PLUS：商品券后的餐品金额满 ¥39 减 ¥5，不含配送；PLUS 另免配送费。</p><h3>下次奖励</h3><p>模拟下单前领取任务，按全部优惠后的餐品实付满 ¥28，记录 1 张下次甜点减 ¥3 券。仅下次含香草甜点时适用，不与其他商品券叠加。本试玩只记录奖励，不提供真实用券。</p><h3>演示身份与图片</h3><p>门店、餐单、价格、会员权益和交易均为本地演示。图片为 AI 概念图，不是官方商品实拍。</p><h3>官方公开历史快照</h3><p>页面随附只读历史查询结果，不代表当前可订价格或库存；未直连实时 MCP。导入失败保留原快照，不会伪装为成功。</p><button data-action="show-reference" class="outline-button full-button">查看历史快照与导入</button></div>`,'rules-sheet');return;
 }
 if(type==='guide'){
  sheetFrame('点好这一餐，三步就够',`<ol class="guide-steps"><li><b>1</b><div><h3>选餐品</h3><p>点餐品看详情，点「＋」加入餐单。</p></div></li><li><b>2</b><div><h3>领任务，看优惠</h3><p>按需领任务，随时查看差额和奖励条件。</p></div></li><li><b>3</b><div><h3>确认模拟下单</h3><p>只生成试玩记录，不付款。</p></div></li></ol><button data-close class="yellow-button full-button">开始点餐</button><button data-action="rules" class="text-button full-button">规则与数据来源</button>`,'guide-sheet');return;
 }
}
function resetDemo(){
 state=structuredClone(initial);restoreWarning='';automaticReminderShown=false;closeSheet();render();toast('已重置，重新点一餐吧');
}
function addProduct(id){
 if((state.cart[id]||0)>=99)return toast('这款餐品最多可选 99 份');
 const fromProduct=currentSheet?.type==='product',canNudge=!currentSheet||fromProduct;
 state.cart[id]=(state.cart[id]||0)+1;
 if(fromProduct)closeSheet();
 render();
 const reminder=canNudge&&!automaticReminderShown?cartReminder(state,quote(state)):null;
 if(reminder){automaticReminderShown=true;openSheet(reminder.type,{reason:reminder.reason});}
 else toast('已加入餐单');
}
function confirmCheckout(){
 try{
  const order=settle(state,nextOrderId(state.ledger));
  state.ledger.unshift(order);state.cart={};state.claimed=false;automaticReminderShown=false;
  currentSheet={type:'receipt',orderId:order.id};render();
 }catch(error){toast(error.message);}
}
function act(action){
 if(['task','cart','checkout','guide','offers','rules'].includes(action))return openSheet(action);
 if(action==='close')return closeSheet();
 if(action==='task-from-checkout')return openSheet('task',{returnTo:'checkout'});
 if(action==='claim-task'){
  if(state.member==='guest'||!quote(state).ok)return;
  state.claimed=true;render();toast('任务已领取，完成达标餐单即可获得奖励');return;
 }
 if(action==='member-demo'){state.member='member';state.claimed=false;render();toast('已切换普通会员体验');return;}
 if(action==='clear-filters'){state.search='';state.tab='全部';render();document.querySelector('#search').focus({preventScroll:true});return;}
 if(action==='clear-cart'){state.cart={};state.claimed=false;automaticReminderShown=false;render();toast('餐单已清空');return;}
 if(action==='confirm-checkout')return confirmCheckout();
 if(action==='reset')return resetDemo();
 if(action==='continue-order'){closeSheet();document.querySelector('#menu').scrollIntoView({block:'start'});return;}
 if(action==='show-ledger'){closeSheet();document.querySelector('#ledger').scrollIntoView({block:'start'});return;}
 if(action==='show-reference'){closeSheet();const details=document.querySelector('#data-reference details');if(details)details.open=true;document.querySelector('#data-reference').scrollIntoView({block:'start'});}
}
document.addEventListener('click',event=>{
 const button=event.target.closest('button');
 if(!button||button.disabled)return;
 if(button.hasAttribute('data-close'))return closeSheet();
 if(button.dataset.add)return addProduct(button.dataset.add);
 if(button.dataset.minus){const id=button.dataset.minus;state.cart[id]--;if(!state.cart[id])delete state.cart[id];render();return;}
 if(button.dataset.productOpen)return openSheet('product',{productId:button.dataset.productOpen});
 if(button.dataset.tab){state.tab=button.dataset.tab;render();return;}
 if(button.dataset.plan){
  const plan=suggestions(state).find(item=>item.id===button.dataset.plan);if(!plan)return;
  if(plan.id!=='keep')state.cart={...plan.cart};
  closeSheet();render();toast(plan.id==='keep'?'就吃这些，原餐单已保留':'已更新餐单与优惠');return;
 }
 if(button.dataset.example){state.cart={[button.dataset.example]:1};state.member='gold';state.couponId='none';state.mode='pickup';state.storeId='river';state.claimed=false;render();return;}
 if(button.dataset.mode){state.mode=button.dataset.mode;render();return;}
 if(button.dataset.action)act(button.dataset.action);
});
document.addEventListener('change',event=>{
 const key=event.target.dataset.field;if(!key)return;
 state[key]=event.target.value;
 if(key==='member'||key==='storeId')state.claimed=false;
 render();
});
document.addEventListener('input',event=>{
 if(event.target.id!=='search')return;state.search=event.target.value;filterProducts();persist();
});
sheet.addEventListener('cancel',event=>{event.preventDefault();closeSheet();});
sheet.addEventListener('click',event=>{
 if(event.target!==sheet)return;
 const bounds=sheet.getBoundingClientRect();
 if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)closeSheet();
});
render();
