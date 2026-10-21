import {stores,locations,coupons,task} from './fixtures.js';
import {validateCart} from './rules.js';
export const initial={cart:{meal30:1},storeId:'river',mode:'pickup',locationId:'office',couponId:'none',member:'gold',claimed:false,ledger:[],tab:'全部',search:''};
export function restore(raw){
 const saved=JSON.parse(raw);validateCart(saved.cart);
 if(!Array.isArray(saved.ledger)||saved.ledger.length>1000)throw new Error('订单记录无效');
 for(const o of saved.ledger){validateCart(o.cart);if(o.demo!==true||!/^DEMO-\d{1,9}$/.test(o.id)||!Number.isSafeInteger(o.quote?.payable)||o.quote.payable<0||![0,1].includes(o.reward)||!['DEMO 已自动发券','未领取任务，无奖励','实付未达门槛，无奖励'].includes(o.status))throw new Error('订单记录无效');if(o.reward===0&&o.rewardCoupon!=null)throw new Error('奖励记录无效');if(o.reward===1&&(o.rewardCoupon?.name!==task.rewardName||o.rewardCoupon?.condition!==task.rewardCondition))throw new Error('奖励记录无效');}
 if(!stores.some(x=>x.id===saved.storeId)||!locations.some(x=>x.id===saved.locationId)||!coupons.some(x=>x.id===saved.couponId)||!['guest','member','gold','plus'].includes(saved.member)||!['pickup','delivery'].includes(saved.mode)||typeof saved.claimed!=='boolean')throw new Error('存档无效');
 return {...structuredClone(initial),cart:saved.cart,ledger:saved.ledger,storeId:saved.storeId,locationId:saved.locationId,couponId:saved.couponId,member:saved.member,mode:saved.mode,claimed:saved.claimed};
}
