import {products,task} from './fixtures.js';

// UI summaries only. Pricing and settlement remain in rules.js.
export const categories=['全部','主食','小食','饮品','甜点'];
export function matchingProducts({tab='全部',search=''}={}){
 const query=String(search).normalize('NFKC').trim().toLocaleLowerCase('zh-CN');
 return products.filter(p=>(tab==='全部'||p.category===tab)&&p.name.normalize('NFKC').toLocaleLowerCase('zh-CN').includes(query));
}
export function futureReward(state,quotation){
 if(!quotation.ok)return {kind:'unavailable',title:'报价恢复后，再看任务进度',detail:'当前不判断奖励资格。',deduction:0};
 if(state.member==='guest')return {kind:'guest',title:'任务为演示会员开放',detail:'可以直接模拟下单，无需加入任务。',deduction:0};
 if(!state.claimed)return {kind:'unclaimed',title:'任务还未领取',detail:'如需体验未来商品券，请在本次模拟下单前领取。',deduction:0};
 if(!quotation.qualifies)return {kind:'pending',title:'已领取，当前未达到任务门槛',detail:`按优惠后餐品实付满 ¥${(task.threshold/100).toFixed(2)} 判断。不必为了奖励加购。`,deduction:0};
 return {kind:'eligible',title:'本单完成后，模拟发放 1 张未来商品券',detail:'只计入下次奖励记录，本单抵扣始终为 ¥0.00。',deduction:0};
}
export function nextOrderId(ledger){
 const maximum=ledger.reduce((max,order)=>{
  const match=/^DEMO-(\d{1,9})$/.exec(order.id);
  return match?Math.max(max,Number(match[1])):max;
 },0);
 return `DEMO-${String(maximum+1).padStart(3,'0')}`;
}
export function receiptSummary(order){
 return {id:order.id,payable:order.quote.payable,quantity:Object.values(order.cart).reduce((sum,n)=>sum+n,0),rewardCount:order.reward,futureDeduction:0,paid:false};
}
