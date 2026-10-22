import {task,goldBenefit} from './fixtures.js';

// Copy and progress for the ordering flow. Amounts come from quote(), in cents.
export function displayProductName(product){
 return product.name.replace('（演示套餐）','');
}
export function rewardProgress(state,quotation){
 if(!quotation.ok)return {kind:'unavailable',gap:null,earned:false,canClaim:false};
 const gap=Math.max(0,task.threshold-quotation.foodPaid);
 if(state.member==='guest')return {kind:'guest',gap,earned:false,canClaim:false};
 if(!state.claimed)return {kind:'unclaimed',gap,earned:false,canClaim:true};
 return {kind:gap===0?'ready':'pending',gap,earned:gap===0,canClaim:false};
}
export function memberProgress(state,quotation){
 if(!quotation.ok)return {kind:'unavailable',gap:null,saving:0};
 if(!['gold','plus'].includes(state.member))return {kind:'not-member',gap:null,saving:0};
 return {kind:quotation.goldDiscount?'applied':'pending',gap:Math.max(0,goldBenefit.threshold-quotation.memberEligibleBase),saving:quotation.goldDiscount};
}
export function cartReminder(state,quotation){
 if(!quotation.ok||!quotation.quantity)return null;
 const reward=rewardProgress(state,quotation),member=memberProgress(state,quotation);
 if(reward.canClaim)return {type:'task',reason:reward.gap===0?'claim-ready':'claim-first'};
 if(reward.earned)return {type:'task',reason:'reward-ready'};
 if(reward.kind==='pending')return {type:'task',reason:'reward-gap'};
 if(member.kind==='pending')return {type:'offers',reason:'member-gap'};
 return null;
}
