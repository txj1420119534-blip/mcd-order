// All values are fictional fixtures, not current McDonald's prices or policies.
export const products = [
 {id:'meal30',name:'轻松一餐（演示套餐）',includedCategories:['主食','小食','饮品'],contents:'鸡腿堡 ×1 · 小薯 ×1 · 可乐 ×1',category:'主食',price:3000,art:'burger',note:'套餐示例 · 用于真实增量比较',tag:'¥30 原餐示例'},
 {id:'meal37',name:'满足一餐（演示套餐）',includedCategories:['主食','小食','饮品'],contents:'牛肉堡 ×1 · 中薯 ×1 · 可乐 ×1',category:'主食',price:3700,art:'chicken',note:'套餐示例 · 用于真实增量比较',tag:'¥37 原餐示例'},
 {id:'dessert',name:'香草甜点',category:'甜点',price:990,art:'dessert',note:'想吃再加 · 不为优惠勉强'},
 {id:'bigmac',name:'经典双层牛肉堡',category:'主食',price:2450,art:'burger',note:'双层牛肉 · 满足这一餐',tag:'人气之选'},
 {id:'chicken',name:'香脆鸡腿堡',category:'主食',price:2200,art:'chicken',note:'酥脆鸡腿 · 清爽生菜'},
 {id:'fries',name:'金黄薯条（中）',category:'小食',price:1250,art:'fries',note:'外脆内软 · 趁热分享',tag:'搭配刚刚好'},
 {id:'nuggets',name:'香酥鸡块（5块）',category:'小食',price:1300,art:'nuggets',note:'一口酥香 · 轻松分享'},
 {id:'cola',name:'可乐（中）',category:'饮品',price:950,art:'cola',note:'冰爽气泡 · 快乐加一'},
 {id:'coffee',name:'美式咖啡',category:'饮品',price:1200,art:'coffee',note:'醇香微苦 · 冷热皆宜'}
];
export const stores = [
 {id:'river',name:'滨江生活广场店',address:'演示城市 · 滨江路 18 号',deliveryFee:600,enabled:true,locations:['office','home']},
 {id:'garden',name:'花园街店',address:'演示城市 · 花园街 66 号',deliveryFee:800,enabled:true,locations:['home']},
 {id:'offline',name:'城市中心店',address:'演示城市 · 中心大道 8 号',deliveryFee:null,enabled:false,locations:[]}
];
export const locations = [{id:'office',name:'办公楼 A（演示点）',detail:'滨江片区 · 演示配送范围内'},{id:'home',name:'花园社区（演示点）',detail:'花园片区 · 演示配送范围内'},{id:'outside',name:'城郊公园（演示点）',detail:'暂无匹配的演示配送范围'}];
export const coupons = [{id:'none',name:'暂不使用商品券',productId:null,discount:0},{id:'burger4',name:'牛肉堡减 ¥4',productId:'bigmac',discount:400},{id:'chicken3',name:'鸡腿堡减 ¥3',productId:'chicken',discount:300}];
export const task = {id:'meal28',title:'门店任务：实付满 ¥28 得下次商品券',threshold:2800,reward:1,rewardName:'甜点减 ¥3 演示商品券',rewardCondition:'仅下次含香草甜点的订单可用；每单最多一张商品券，不能叠加其他商品券；有效期与真实适用范围未核验，本地仅模拟发券。'};
export const goldBenefit={threshold:3900,discount:500,basis:'商品券后、金卡优惠前的餐品金额，不含配送费'};
