# 官方只读参考与 MCP 边界

核查日期：2026-10-23（Asia/Singapore）。本轮仅公开只读读取，没有登录、获取凭据、交易或向参考项目写入。

## 取得的官方证据

- 来源：[M-China/mcd-mcp-server 官方 README](https://github.com/M-China/mcd-mcp-server/blob/main/README.md)
- 实际读取：[原始 Markdown](https://raw.githubusercontent.com/M-China/mcd-mcp-server/main/README.md)，HTTP 200，18,722 字节。
- 原始读取记录：`requests.json`；完整只读原文：`mcp-readme.txt`。
- SHA256：`03c3cd6a8d31b7b79eb4d8204929e3fe766fc213f19677acc4c08ccabca26536`。

官方将 MCP 定义为“数据交互接口服务”。README 公开的 query-meals 查询门店菜单，query-meal-detail 查询餐品与套餐组成，mall-product-detail 查询商品图片/积分/有效期/说明，calculate-price 计算价格，campaign-calendar 查询活动日历。

本项目保留的历史工具契约也说明：query_meals 的餐品详情可有 image 字段；campaign_calendar 可有 activityBgImg、couponImage、articleDto.imgList 等字段。**这些是结构化数据和图片链接；现有公开工具列表没有获取完整点餐网页 HTML、手机小程序界面或官方交互弹窗的工具。**因此不能声称“直连 MCP 就取得了官方页面”。

当前会话没有实际可调用的麦当劳业务 MCP 工具。另对官方端点 `https://mcp.mcd.cn` 做了一次不带凭据的标准 MCP initialize 能力探测；请求在代理 CONNECT 阶段返回 `403 Forbidden`，没有取得 Schema 或业务结果。探测记录见 `mcp-connection-attempt.json`。本轮未发起新的真实 MCP 业务查询，没有实时连接成功证据；不能将此代理错误解释为 Token 失效、用户所在地受限或官方业务结果。三个随附 snapshot.json 均为原有历史快照，未发现图片 URL，不能据此恢复当前官方图片。

## 未能直接查看的页面

以下请求均在网络代理连接阶段返回 `403 Forbidden`，未取得网页内容，不应把它们列为已截图的视觉参考：

- [麦当劳中国首页](https://www.mcdonalds.com.cn/)
- [麦当劳中国餐品页](https://www.mcdonalds.com.cn/index/Food/index.html)
- [官方 MCP 开放页面](https://open.mcd.cn/mcp)

## 本轮独立适配

1. 点餐：从公开接口的数据概念中提取“门店—分类—餐品—购物袋—优惠—结算”结构；任务领取、差额提醒和未来奖励弹窗依据本项目已测试的本地业务规则独立设计，不冒充官方当前活动。
2. 派对：采用主题、人数、预算、菜单和活动安排的信息顺序；官方儿童主题商品保留适用范围，成人方案继续为本地策划。
3. 游戏：不由官方抽奖或商城兑换推导自定义游戏积分能力；原三款游戏规则保留，用独立生成的图片素材改善角色与场景。
4. MCP 在线接入必须由安全宿主管理凭据；静态网站不内置 Token、不直连带凭据接口。只读数据与交易接口分开，错误与未知状态不得回退成模拟成功。

## 可学习点与适配成本

| 只读来源 | 可学习点 | 我们的独立方案 | 适配成本与边界 |
| --- | --- | --- | --- |
| 官方 MCP README / query-meals、query-meal-detail | 门店、餐品分类、套餐组成和图片字段的组织方式 | 本地分类菜单、餐品详情弹层和购物袋 | 页面组织成本低；如接入实时数据，需额外做宿主鉴权、字段适配、时效和错误处理，本轮未完成实时接入 |
| 官方 MCP README / calculate-price | 价格计算应独立于页面呈现 | 保留已测试的本地报价规则，分别呈现本单优惠、任务门槛和未来奖励 | 本地 UI 适配成本中等；模拟价格不等于官方实时价格 |
| 官方 MCP README / campaign-calendar、mall-product-detail | 活动时间、适用范围、图片及商品说明必须一起展示 | 历史快照折叠面板保留时间与范围；成人聚会单独作为本地计划 | 范围说明适配成本低；公开字段不意味着已获得素材授权或可订库存 |
| 麦当劳中国公开首页 / 餐品页 | 本轮网络受限，未获得页面内容 | 未复制页面；使用独立排版与原创生成概念图 | 未能评估当前官网逐页适配成本，不宣称已复刻官方界面 |

## 权利与来源

本轮没有将官方 README 图片、第三方代码或素材复制进产品。README 本身声明不构成商标授权；公开可读不代表取得使用权。产品采用原创生成概念图与独立排版，并保留非官方演示身份。视觉参考的可验证范围限于上述实际取得的文档；官网视觉仍属未核验。
