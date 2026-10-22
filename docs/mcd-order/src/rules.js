import {products,stores,coupons,task,goldBenefit} from './fixtures.js';
export const money = cents => Number.isInteger(cents) ? `¥${(cents/100).toFixed(2)}` : '待确认';
export function validateCart(cart){
 if(!cart || typeof cart!=='object' || Array.isArray(cart)) throw new Error('购物袋数据无效');
 for(const [id,qty] of Object.entries(cart)) if(!products.find(p=>p.id===id)||!Number.isSafeInteger(qty)||qty<0||qty>99) throw new Error('商品或数量无效');
 return cart;
}
export const taskEligible = foodPaid => Number.isSafeInteger(foodPaid) && foodPaid >= task.threshold;
export function quote(state){
 try{
  validateCart(state.cart);
  const store=stores.find(s=>s.id===state.storeId);
  if(!store||!store.enabled) throw new Error('门店数据暂不可用，请切换门店');
  if(!['pickup','delivery'].includes(state.mode)) throw new Error('请选择取餐方式');
  if(!['guest','member','gold','plus'].includes(state.member)) throw new Error('会员状态无效');
  if(state.mode==='delivery'&&!store.locations.includes(state.locationId)) throw new Error('该门店暂不支持此演示配送点');
  const coupon=coupons.find(c=>c.id===state.couponId);
  if(!coupon) throw new Error('优惠券数据无效');
  const subtotal=Object.entries(state.cart).reduce((n,[id,qty])=>n+products.find(p=>p.id===id).price*qty,0);
  const couponApplied=!!(coupon.productId && state.cart[coupon.productId]>0);
  const discount=couponApplied?coupon.discount:0;
  const memberEligibleBase=subtotal-discount;
  const goldDiscount=['gold','plus'].includes(state.member)&&memberEligibleBase>=goldBenefit.threshold?goldBenefit.discount:0;
  const foodPaid=memberEligibleBase-goldDiscount;
  const deliveryFee=state.mode==='delivery'?store.deliveryFee:0;
  if(!Number.isInteger(deliveryFee)) throw new Error('配送费缺失，无法计算实付');
  // Fixture PLUS benefit waives delivery, independent of one product coupon.
  const deliveryBenefit=state.member==='plus'?deliveryFee:0;
  const memberBenefit=goldDiscount+deliveryBenefit;
  const payable=foodPaid+deliveryFee-deliveryBenefit;
  return {ok:true,subtotal,discount,couponApplied,memberEligibleBase,goldDiscount,foodPaid,deliveryFee,deliveryBenefit,memberBenefit,payable,gap:Math.max(0,task.threshold-foodPaid),qualifies:taskEligible(foodPaid),quantity:Object.values(state.cart).reduce((a,b)=>a+b,0)};
 }catch(e){return {ok:false,error:e.message};}
}
export function suggestions(state){
 const base=quote(state);if(!base.ok||!base.quantity)return [];
 const result=[{id:'keep',title:'照原样就很好',description:'保留已选餐品，不额外消费。',cart:{...state.cart},quote:base,increment:0}];
 const present=new Set(products.filter(p=>state.cart[p.id]>0).flatMap(p=>p.includedCategories||[p.category]));
 const missing=products.filter(p=>!present.has(p.category)).sort((a,b)=>(a.id==='dessert'?-1:b.id==='dessert'?1:a.price-b.price));
 if(missing.length){const p=missing[0],cart={...state.cart,[p.id]:(state.cart[p.id]||0)+1},q=quote({...state,cart});if(q.ok)result.push({id:'add',title:`补一份${p.category}`,description:`加 1 份${p.name}，只在你想吃时选择。`,cart,quote:q,increment:q.payable-base.payable});}
 const equivalent=(a,b)=>JSON.stringify(a.includedCategories||[a.category])===JSON.stringify(b.includedCategories||[b.category]);
 const source=products.find(p=>state.cart[p.id]>0 && products.some(t=>equivalent(t,p)&&t.price<p.price));
 if(source){const target=products.filter(p=>equivalent(p,source)&&p.price<source.price).sort((a,b)=>a.price-b.price)[0]; const cart={...state.cart}; const qty=cart[source.id]; delete cart[source.id];cart[target.id]=(cart[target.id]||0)+qty;const q=quote({...state,cart}); if(q.ok)result.push({id:'swap',title:'换个口味，份数不变',description:`${qty} 份${source.name}换为${qty} 份${target.name}；原有其他餐品保留。`,cart,quote:q,increment:q.payable-base.payable});}
 return result;
}
export function settle(state,orderId,now=new Date().toISOString()){
 const q=quote(state);if(!q.ok)throw new Error(q.error);if(!q.quantity)throw new Error('购物袋还是空的');
 const claimed=state.member!=='guest'&&state.claimed===true;
 return {id:orderId,createdAt:now,mode:state.mode,cart:{...state.cart},quote:{...q},reward:claimed&&q.qualifies?task.reward:0,rewardCoupon:claimed&&q.qualifies?{name:task.rewardName,condition:task.rewardCondition}:null,status:claimed&&q.qualifies?'DEMO 已自动发券':!claimed?'未领取任务，无奖励':'实付未达门槛，无奖励',demo:true};
}

// Generic fixture-only threshold comparison: discount is an order benefit,
// never presented as savings against the original meal. All inputs are cents.
export function compareThresholdOffer({original,addition,threshold,discount}){
 if(![original,addition,threshold,discount].every(x=>Number.isSafeInteger(x)&&x>=0))throw new Error('金额必须为非负整数分');
 const beforeDiscount=original+addition;
 const applied=beforeDiscount>=threshold?Math.min(discount,beforeDiscount):0;
 const after=beforeDiscount-applied;
 return {original,addition,threshold,applied,after,increment:after-original};
}
