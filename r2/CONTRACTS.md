# 本会话已暴露并实际调用的只读契约

保存的是 2026-10-19 本会话工具声明，不包含认证配置。底层 HTTP/JSON-RPC 状态不由宿主回传，因此只断言 MCP isError=false 与结构化业务 success=true/code=200。

Description: 计算商品的价格（含优惠），支持到店自提(orderType=1)和外送(orderType=2)两种场景
When：
- 用户问"这些商品多少钱"
- 用户问"总价是多少"
Input:
- reservationDate: 预约场景必传，非预约场景不传。格式: yyyy-MM-dd HH:mm
- storeCode: 门店编码
- orderType 和 beCode 传递规则（根据用户选择的 beType 确定）：
  到店自取(beType=1) → orderType=1，不传 beCode
  得来速(beType=5)   → orderType=1，必传 beCode（从 query-nearby-stores 获取）
  麦乐送(beType=2)   → orderType=2，必传 beCode（从 delivery-query-stores 获取）
  团餐(beType=6)     → orderType=2，必传 beCode（从 delivery-query-stores 获取）
- items: 商品列表（数组）
  - productCode: 商品编码，必填
  - quantity: 商品数量，必填，大于等于1
  - couponId: 优惠券ID，选填（如果用户要使用优惠券）
  - couponCode: 优惠券编码，选填（如果用户要使用优惠券）
  - modification: 特制选项（来自 query-meal-detail 返回的 modification 信息）
    - values[]: 特制选项列表
      - code: 特调商品code
      - key: 特制key（⚠️ 重要规则见下方）
      - quantity: 特制数量
    ⚠️ key 传参规则：
    - 用户选中的特调项：key = query-meal-detail 返回的 selectedKey
    - 用户未选中的特调项：若该项的 unselectedKey 不为空，key = unselectedKey，也必须传入
    - 即：对于包含 unselectedKey 的特调组，该组内所有特调项都必须传入，选中的用 selectedKey 作为 key，未选中的用 unselectedKey 作为 key
- gmServiceCode: 企业团餐场景下，助餐服务code
- withOrder: 随单购商品，随单购商品来自query-meals，用户可以选择随单购，随单购可享受随单购优惠
- needTableware: 是否需要餐具费
Next：
- 计算成功后：返回的价格字段单位为"分"，展示时需除以100转为"元"
- 引导用户："确认价格后，可以说'创建订单'进行下单"

exec tool declaration:
```ts
declare const tools: { mcp__mcd_china__calculate_price(args: {
  // 业务编码，与storeCode 配对使用，从query-nearby-stores或delivery-query-stores返回结果中获取。得来速(beType=5)/外送(orderType=2)/团餐场景必传，到店自取(beType=1)场景不传
  beCode?: string;
  // 1-到店取餐，2-麦乐送到家，5-得来速(DT)，6-企业团餐
  beType: 1 | 2 | 5 | 6;
  // 团餐-助餐服务码
  gmServiceCode?: string;
  // 待价格计算的商品列表
  items?: Array<{
  // 优惠券code
  couponCode?: string;
  // 优惠券Id
  couponId?: string;
  // 商品特制选项
  modification?: {
  // 特制选项列表
  values?: Array<{
  // 特制code
  code?: string;
  // 特制key
  key?: string;
  // 特制数量
  quantity?: number;
}>;
};
  // 商品code
  productCode?: string;
  // 数量，必填，不能为空，且大于等于1
  quantity?: number;
  // 套餐子项
  roundList?: Array<{
  // 套餐套餐round下商品
  comboItemList?: Array<{
  // 商品编码
  code?: string;
  // 商品特制选项
  modification?: {
  // 特制选项列表
  values?: Array<{
  // 特制code
  code?: string;
  // 特制key
  key?: string;
  // 特制数量
  quantity?: number;
}>;
};
  // 商品数量
  quantity?: number;
}>;
  // 套餐round
  round?: string;
}>;
}>;
  // 是否需要餐具，true需要，false不需要
  needTableware?: boolean;
  // 订单类型，1-到店（含到店自取+得来速车道取餐），2-外送（含麦乐送+企业团餐）
  orderType: 1 | 2;
  // 预约场景必传，非预约场景不传。格式:yyyy-MM-dd HH:mm
  reservationDate?: string;
  // 门店编码（storeCode）, 不能为空
  storeCode: string;
  // 随单购商品
  withOrder?: {
  // 随单购卡id
  cardId?: string;
  // 随单购卡类型
  cardType?: number;
  // 随单购会员code
  membershipCode?: string;
  // 随单购规格id
  membershipSpecId?: string;
};
}): Promise<CallToolResult<{
  // No comments found.
  data?: {
  // 运费原价 单位分
  deliveryOriginalPrice?: number;
  // 运费现价 单位分
  deliveryPrice?: number;
  // 优惠金额 单位分
  discount?: number;
  // 可享受的优惠
  enjoyable?: {
  // 1 特价 2 折扣 3 立减
  amountType?: string;
  // 门槛差额(可享受的优惠时才有值)，单位分
  balance?: number;
  // 实际优惠值  特价(ex:18)  折扣（ex:7.5） 立减(ex:5)  金额单位是元 与discount区别计算了tender
  realDiscount?: number;
};
  // 已享受的优惠
  enjoyed?: {
  // 1 特价 2 折扣 3 立减
  amountType?: string;
  // 门槛差额(可享受的优惠时才有值)，单位分
  balance?: number;
  // 实际优惠值  特价(ex:18)  折扣（ex:7.5） 立减(ex:5)  金额单位是元 与discount区别计算了tender
  realDiscount?: number;
};
  // 可选的助餐服务列表
  mealAssistanceList?: Array<{
  // 助餐服务编码
  code?: string;
  // 助餐服务名称
  name?: string;
}>;
  // 原价 单位分
  originalPrice?: number;
  // 打包费原价 单位分
  packingOriginalPrice?: number;
  // 打包费现价 单位分
  packingPrice?: number;
  // 现价 单位分
  price?: number;
  // 商品列表
  productList?: Array<{
  // 商品原小计 单位分
  originalSubtotal?: number;
  // 商品编码
  productCode?: string;
  // 商品名称
  productName?: string;
  // 数量
  quantity?: number;
  // 商品小计 单位分
  subtotal?: number;
}>;
  // 商品原价 单位分
  productOriginalPrice?: number;
  // 商品现价 单位分
  productPrice?: number;
  // 餐具费现价 单位分
  tablewarePrice?: number;
  // 可选的取餐方式选项列表
  takeWayList?: Array<{
  // 取餐方式code，到店下单时需要携带
  code?: string;
  // 取餐方式副标题
  subtitle?: string;
  // 取餐方式标题
  title?: string;
}>;
};
  // No comments found.
  message?: string;
  // No comments found.
  traceId?: string;
}>>; };
```

查询麦当劳中国当月的营销活动日历，返回进行中、往期和未来日期的活动。适用于查看用户进行中和即将到来的可参与活动，还可查询用户对活动的订阅状态。
When：
  - 用户问"最近有什么活动"、"这个月有什么优惠活动"、"有什么可以参加的"
  - 用户想查看品鉴会、主题派对等活动信息

exec tool declaration:
```ts
declare const tools: { mcp__mcd_china__campaign_calendar(args: {
  // 可选的查询基准日期（格式：yyyy-MM-dd）；若传入，则以该日为锚点，返回当天及时间线上与其最邻近的前后各一个有活动的日子（共三天）；若不填，默认返回当前月所有活动
  specifiedDate?: string;
}): Promise<CallToolResult<{
  // 响应码 (200表示成功)
  code: number;
  // 活动日历数据
  data: {
  // 当前时间
  currentTime?: string;
  // 每日活动列表
  dailyList?: Array<{
  // 日期 (yyyy-MM-dd)
  date?: string;
  // 日期文案
  dateText?: string;
  // 事件列表
  events?: Array<{
  // 活动事件背景图
  activityBgImg?: string;
  // 活动副标题
  activitySubTitle?: string;
  // 活动事件标题
  activityTitle?: string;
  // 文章信息
  articleDto?: {
  // 内容
  content?: string;
  // 图片列表
  imgList?: Array<string>;
  // 标题
  title?: string;
};
  // 优惠券图片
  couponImage?: string;
  // 优惠券信息
  couponInfo?: {
  // 券Code
  couponCode?: string;
  // 券ID
  couponId?: string;
  // 是否全天可用: 0-否, 1-是
  isAllTradeTime?: number;
  // 核销结束日期
  tradeEndDate?: string;
  // 核销开始日期
  tradeStartDate?: string;
  // 核销时间段
  tradeTimePeriods?: Array<{
  // 结束时间
  endTime?: string;
  // 开始时间
  startTime?: string;
}>;
  // 核销日周几限制 (1-周日, 2-周一, ..., 7-周六)
  weekdays?: Array<number>;
};
  // 事件类型: 0-活动, 1-神秘期活动, 2-优惠券, 3-品鉴会, 4-CMS文章, 5-麦麦省, 6-派对
  eventType?: number;
  // 价格
  price?: string;
}>;
  // 是否是当天
  today?: boolean;
}>;
  // 已订阅的活动列表
  subscribedEvents?: Array<{
  // 活动事件背景图
  activityBgImg?: string;
  // 活动副标题
  activitySubTitle?: string;
  // 活动事件标题
  activityTitle?: string;
  // 文章信息
  articleDto?: { [key: string]: unknown; };
  // 优惠券图片
  couponImage?: string;
  // 优惠券信息
  couponInfo?: { [key: string]: unknown; };
  // 事件类型: 2-优惠券, 3-品鉴会, 6-派对
  eventType?: number;
  // 价格
  price?: string;
}>;
};
  // 响应消息
  message: string;
}>>; };
```

查询可兑换餐品券列表 - 当用户询问"有哪些积分兑换商品"、"积分可以兑换什么"、"查看积分商城"时使用
支持类目规则筛选：商品券(1>4)、实物商品(2)、周边产品(2>8)、实物礼品卡(2>9)、生日类派对(1>6>20)、主题类派对(1>6>21)、麦麦体验营(1>6>22)、品鉴会(1>6>25)、读书会(1>6>34)、积分兑换活动(1>6>40)


exec tool declaration:
```ts
declare const tools: { mcp__mcd_china__mall_points_products(args: {
  // 类目规则筛选，支持多选（逗号分隔），非必传，不传时默认查询所有类型。
  // 可选值：
  // - 1>4: 商品券（非预付优惠券）
  // - 2: 实物商品
  // - 2>8: 周边产品
  // - 2>9: 实物礼品卡
  // - 1>6>20: 生日类派对
  // - 1>6>21: 主题类派对
  // - 1>6>22: 麦麦体验营
  // - 1>6>25: 品鉴会
  // - 1>6>34: 读书会
  // - 1>6>40: 积分兑换活动
  // 示例：1>4,2
  catRuleIds?: string;
}): Promise<CallToolResult<{ code?: number; data?: Array<{
  // 商品所属类目名称
  catName?: string;
  // 下架时间，商品可以兑换的截止时间
  downTime?: string;
  // 所需积分
  point?: string;
  // 所需金额
  price?: string;
  // 商品卖点
  selling?: string;
  // 门店ID
  shopId?: number;
  // 商品ID
  spuId?: number;
  // 商品图片
  spuImage?: string;
  // 商品名称
  spuName?: string;
  // 商品状态：1-仓库中；2-上架；3-售罄；4-下架；5-预热
  status?: number;
  // 上架时间，商品可以兑换的起始时间
  upTime?: string;
}>; message?: string; }>>; };
```

Description: 餐品列表, 支持到店自提(orderType=1)和外送(orderType=2)两种场景
企业团餐场景下，可按照这个规则给用户进行搭配
- **20元以下**: 小食
- **20-30元**：汉堡+小食 或 汉堡+饮料
- **30-40元**：汉堡+薯条/小食+饮料
- **40-50元**：汉堡+薯条+小食+饮料
- **50元以上**：丰富组合，优先不重复小食
When:
- 当用户要购买某个餐品时，需要查询一下餐品列表
- 当用户要查看餐品时价格时，需要查询一下餐品列表
- 用户要搭配任何商品时进行下单，都需要查询餐品列表，获取商品code
Input:
- storeCode: 门店编码，必填
- orderType 和 beCode 传递规则（根据用户选择的 beType 确定）：
到店自取(beType=1) → orderType=1，不传 beCode
得来速(beType=5)   → orderType=1，必传 beCode（从 query-nearby-stores 获取）
麦乐送(beType=2)   → orderType=2，必传 beCode（从 delivery-query-stores 获取）
团餐(beType=6)     → orderType=2，必传 beCode（从 delivery-query-stores 获取）
- reservationDate: 预约场景必传，非预约场景不传。格式: yyyy-MM-dd HH:mm

exec tool declaration:
```ts
declare const tools: { mcp__mcd_china__query_meals(args: {
  // 业务编码，与storeCode 配对使用，从query-nearby-stores或delivery-query-stores返回结果中获取。得来速(beType=5)/外送(orderType=2)/团餐场景必传，到店自取(beType=1)场景不传
  beCode?: string;
  // 1-到店取餐，2-麦乐送到家，5-得来速(DT)，6-企业团餐
  beType: 1 | 2 | 5 | 6;
  // 订单类型，1-到店（含到店自取+得来速车道取餐），2-外送（含麦乐送+企业团餐）
  orderType: 1 | 2;
  // 预约场景必传，非预约场景不传。格式:yyyy-MM-dd HH:mm
  reservationDate?: string;
  // 门店编码（storeCode）, 不能为空
  storeCode: string;
}): Promise<CallToolResult<{
  // No comments found.
  data?: {
  // 菜单分类列表
  categories?: Array<{
  // 该分类下的餐品列表
  meals?: Array<{
  // 餐品唯一编码
  code?: string;
  // 餐品标签列表
  tags?: Array<string>;
}>;
  // 菜单分类名称
  name?: string;
}>;
  // 常点餐品
  frequent?: {
  // 餐品唯一编码
  code?: string;
  // 餐品标签列表
  tags?: Array<string>;
};
  // 餐品详情映射表
  meals?: {
  // 餐品完整详情实体
  mapKey?: {
  // 是否可随单购
  canWithOrder?: boolean;
  // 餐品现价（销售价）
  currentPrice?: string;
  // 享受优惠的类型
  discountType?: string;
  // 商品图片
  image?: string;
  // 餐品名称
  name?: string;
  // 商品原价（划线价）
  originalPrice?: string;
  // 随单购商品
  withOrder?: {
  // 随单购卡id
  cardId?: string;
  // 随单购卡类型
  cardType?: number;
  // 随单购会员code
  membershipCode?: string;
  // 随单购规格id
  specId?: string;
};
};
};
};
  // No comments found.
  message?: string;
  // No comments found.
  traceId?: string;
}>>; };
```

Description: 到店场景下，查询用户可点餐门店，需要用户明确是到店自取还是车道取餐
- beType=1(到店自提): 返回的门店无 beCode，后续工具调用不传 beCode
- beType=5(得来速): 返回的门店有 beCode，后续工具调用必须传 beCode
When：
- 用户询问"我想到店", "我想驾车去麦当劳"
- 看看我附近有哪些麦当劳的门店
Input:
- searchType: 必传，searchType=2 按位置进行搜索， searchType=1 搜索收藏餐厅，默认searchType=1
- city: 城市，searchType=2 时必填
- keyword: 位置关键词，searchType=2 时必填
- beType: 必填，1-到店自取, 5-得来速车道取餐(Drive Through)
On Error：
- 用户没有收藏记录，可使用搜索功能进行搜索
Next：
- 展示门店的 storeCode 和 beCode（beType=5 时）
- reservation=true 时完整展示 reservationTimeOptions，today=true 标记"(今天)"
- 引导用户选择门店

exec tool declaration:
```ts
declare const tools: { mcp__mcd_china__query_nearby_stores(args: {
  // beType必传，1：到店自提, 5-得来速车道取餐(Drive Through)
  beType: 1 | 5;
  // 城市名
  city?: string;
  // 关键词
  keyword?: string;
  // searchType=2 按位置进行搜索， searchType=1 搜索收藏餐厅，默认searchType=1
  searchType: 1 | 2;
}): Promise<CallToolResult<{
  // No comments found.
  data?: Array<{
  // 门店地址，工具入参必须展示
  address?: string;
  // 业务编码，与storeCode配对使用。得来速/外送/团餐场景下，后续所有工具调用（query-meals、calculate-price、create-order等）都必须同时传递 storeCode 和 beCode
  beCode?: string;
  // 营业结束时间
  businessEndTime?: string;
  // 营业开始时间
  businessStartTime?: string;
  // 门店营业状态，true：营业，false：暂停营业
  businessStatus?: boolean;
  // 距离
  distance?: number;
  // 是否支持预约，true：支持预约，false：不支持预约
  reservation?: boolean;
  // 可选预约送达时间列表（必须全部展示给用户，不得省略任何日期或时段，用户需要从中选择预约时间）
  reservationTimeOptions?: Array<{
  // 预约日期，格式 yyyy-MM-dd
  date?: string;
  // 该日期可选的预约时段，包含时段名称和时间范围，必须完整展示，格式 yyyy-MM-dd
  reservationOptionText?: string;
  // 今日是否可预约，true:今日可预约， false:今日不可预约
  today?: boolean;
}>;
  // 门店编码
  storeCode?: string;
  // 门店名称
  storeName?: string;
}>;
  // No comments found.
  message?: string;
  // No comments found.
  traceId?: string;
}>>; };
```

Description: 活动派对商品配置场次城市列表, 必须先确定spuId(从 mall-points-products 获取）或查询商品详情（从 mall-product-detail 获取)
When：
- 用户询问"主题派对在哪些城市"
- 用户询问"我想参加主题派对"
- 用户询问"生日类派对/主题类派对/麦麦体验营/品鉴会/读书会/积分兑换活动"
Preconditions：
- 必须先确定spuId（从 mall-points-products 获取或从 mall-product-detail获取）
Input:
- spuId: spuId 需要从查询可兑换商品列表（从 mall-points-products 获取）或查询商品详情（从 mall-product-detail 获取）中让用户选择一个spu，获取对应的skuId

exec tool declaration:
```ts
declare const tools: { mcp__mcd_china__query_party_city(args: {
  // spuId
  spuId: number;
}): Promise<CallToolResult<{
  // 城市列表
  data?: Array<{
  // 城市编码
  code?: number;
  // 首字母
  initial?: string;
  // 纬度
  latitude?: number;
  // 经度
  longitude?: number;
  // 城市名称
  name?: string;
  // 排序号
  sortNo?: number;
}>;
  // No comments found.
  message?: string;
  // No comments found.
  traceId?: string;
}>>; };
```

Description: 查询指定城市下支持主题派对的门店列表。当用户选择了城市后，需要查看该城市有哪些门店可举办生日类派对/主题类派对/麦麦体验营/品鉴会/读书会/积分兑换活动时使用
Preconditions：
- 必须先通过 query-party-city 获取城市code和经纬度
- 必须先确定spuId（从 mall-points-products 获取或从 mall-product-detail获取）
Input:
- code: 城市code, 城市下的门店列表获取(query-party-city)
- latitude: 纬度, 城市下的门店列表获取(query-party-city)
- longitude: 经度, 城市下的门店列表获取(query-party-city)
- spuId: spuId, 从 mall-points-products 或 mall-product-detail 获取

exec tool declaration:
```ts
declare const tools: { mcp__mcd_china__query_party_store(args: {
  // 城市code
  code: string;
  // 纬度，从 query-party-city 返回结果的 data[].latitude 获取
  latitude?: number;
  // 经度，从 query-party-city 返回结果的 data[].longitude 获取
  longitude?: number;
  // spuId，从 mall-points-products 或 mall-product-detail 获取
  spuId?: number;
}): Promise<CallToolResult<{
  // 门店列表
  data?: Array<{
  // 餐厅地址
  address?: string;
  // 营业状态
  businessStatus?: number;
  // 城市编码
  cityCode?: string;
  // 城市名称
  cityName?: string;
  // 餐厅编码
  code?: string;
  // 距离
  distance?: number;
  // 距离文本
  distanceText?: string;
  // 纬度
  latitude?: number;
  // 经度
  longitude?: number;
  // 餐厅名称
  name?: string;
  // No comments found.
  onlineBusinessStatus?: boolean;
  // 餐厅短名称
  shortName?: string;
}>;
  // No comments found.
  message?: string;
  // No comments found.
  traceId?: string;
}>>; };
```

Description: 查询指定门店支持生日类派对/主题类派对/麦麦体验营/品鉴会/读书会/积分兑换活动的可预约日期列表。当用户选择了门店后，需要查看该门店哪些日期可预约时使用。
When：
- 用户询问"这家店哪天可以预约"
- 用户询问"可预约日期"
- 用户询问"查看门店日历"
- 用户询问"哪天有场次"
- 用户选择门店后询问日期
Preconditions：
- 必须确定 spuId（从 mall-points-products 获取或从 mall-product-detail获取）
- 必须先通过 query-party-store 获取 storeCode
Input:
- storeCode: 门店code, 城市下的门店列表获取(query-party-store)
- spuId: spuId, 需要从查询可兑换商品列表（从 mall-points-products 获取）或查询商品详情（从 mall-product-detail 获取）中让用户选择一个spu，获取对应的skuId

exec tool declaration:
```ts
declare const tools: { mcp__mcd_china__query_party_store_date(args: {
  // spuId
  spuId: number;
  // 门店code
  storeCode: string;
}): Promise<CallToolResult<{
  // 可预约日期列表
  data?: Array<{
  // 日期
  date?: string;
  // spuId
  spuId?: number;
  // 门店编码
  storeCode?: string;
}>;
  // No comments found.
  message?: string;
  // No comments found.
  traceId?: string;
}>>; };
```

Description: 查询指定门店、指定日期下的生日类派对/主题类派对/麦麦体验营/品鉴会/读书会/积分兑换活动场次列表。当用户选择了日期后，需要查看当天有哪些场次可预约时使用。
When：
- 用户询问"查看主题活动场次列表"
- 用户询问"几点有场次"
Preconditions：
- 必须确定 spuId（从 mall-points-products 获取或从 mall-product-detail获取）
- 必须先通过 query-party-store 获取 storeCode
- 必须先通过 query-party-store-date 获取 dateStr
Input:
- spuId: spuId, 需要从查询可兑换商品列表（从 mall-points-products 获取）或查询商品详情（从 mall-product-detail 获取）中让用户选择一个spu，获取对应的skuId
- storeCode: 门店code, 城市下的门店列表获取(query-party-store)
- dateStr: 门店日期, 城市下的门店列表获取(query-party-store-date)

exec tool declaration:
```ts
declare const tools: { mcp__mcd_china__query_party_store_session(args: {
  // 门店日期
  dateStr: string;
  // spuId
  spuId: number;
  // 门店code
  storeCode: string;
}): Promise<CallToolResult<{
  // 场次列表
  data?: Array<{
  // 大厨编码
  cookEmpNo?: string;
  // 场次id
  id?: number;
  // 剩余场次
  leftNum?: number;
  // 当前场次操作人编号
  opEmpNo?: string;
  // 最大成团人数
  partyMax?: number;
  // 最小成团人数
  partyMin?: number;
  // 价格
  price?: number;
  // 当前场次店长编号
  rgmEmpNo?: string;
  // 场次结束时间
  timeEnd?: string;
  // 场次开始时间
  timeStart?: string;
}>;
  // No comments found.
  message?: string;
  // No comments found.
  traceId?: string;
}>>; };
```
