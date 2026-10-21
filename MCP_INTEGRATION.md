# R2 宿主桥接与快照刷新

本包交付时间戳快照，静态网页不直连 MCP、不自动刷新。实际只读调用由已授权宿主工具完成。前端没有 endpoint、凭据或认证配置。参数和返回声明见 r2/CONTRACTS.md，35 个实际暴露的工具名称见 r2/TOOL_INVENTORY.json。

## 本次实际调用

```js
campaign_calendar({})
query_nearby_stores({beType:1, city:'上海', keyword:'人民广场', searchType:2})
query_meals({beType:1, orderType:1, storeCode:'1450713'})
calculate_price({beType:1, orderType:1, storeCode:'1450713', items:[{productCode:'1100', quantity:1}]})
mall_points_products({catRuleIds:'1>6>20'})
query_party_city({spuId:8084})
query_party_store({code:'310100', latitude:31.230525, longitude:121.473667, spuId:8084})
query_party_store_date({spuId:8084, storeCode:'1450124'})
query_party_store_session({dateStr:'2026-10-20', spuId:8084, storeCode:'1450124'})
```

均为公开示例测试，SPU、城市、门店、日期来自前序返回，不是用户位置或实际消费选择。刷新时重新取上游值，不沿用过期承诺。

9 次调用的 MCP isError=false，结构化 success=true、code=200。宿主没有暴露底层 HTTP/JSON-RPC 状态，未独立断言这些层级。每条快照保留 UTC 采集时间、服务端 datetime 和截短 traceRef。未保存订阅、员工编号、券码、会员/随单购标识或认证数据。

## 可运行的导入闭环

1. 在能使用已有授权 MCP 工具的宿主内，按当前 schema 执行相应公开只读查询。不得读取配置、环境、日志或浏览器里的凭据，不改变认证或重启应用。
2. 在内存组装 bundle：`{capturedAt:'UTC ISO 8601', records:[{tool:'工具短名', args:{公开参数}, capturedAt:'UTC ISO 8601', result:{isError:false, structuredContent:实际业务响应}}]}`。
3. 调用 `r2/readonly-core.js` 的 `normalizeHostBundle(bundle, project)`，只保存其白名单投影。也可通过 stdin 运行下面命令，避免将未投影的完整响应写入持久文件或日志。
4. 页面选择“导入宿主快照”。验证 project、snapshot 模式、允许工具、成功状态、必要字段以及门店/商品/场次关联；失败保留当前快照。导入不写 localStorage。
5. 静态网页无法独立验证来源，导入后始终标注“用户导入、来源真实性未独立核验”。随附快照真实性以本次宿主调用回执为证据。

```sh
node r2/normalize.mjs order - snapshot.json
# 第一个参数按本项目选择 order / party / games，stdin 接收 bundle JSON。
# 不调用网络，不读取环境变量，不接受 endpoint 或 token 参数。
```

normalizer 最多接受 2MB，全部校验完成后才写输出；缺字段、isError 或业务失败不会输出成功。更新内置版本时同步生成 snapshot.js 的 export default 对象，再运行 test:r2 和 build；普通刷新仅需导入 JSON。

## 产品限制

点单菜单保留 currentPrice/originalPrice 原字段与 discountType 条件。巨无霸报价依据 calculate_price 明确的“分”单位换算为 ¥25.50。真实快照没有用于演示购物车结算，实际门槛叠加、会员资格和任务发券规则尚未验证。未享优惠/未来奖励没有抵本单。

Party 官方样本面向儿童；成人朋友生日方案继续为本地策划，不声称官方商品适用。场次 price=5000 的单位未由 schema 明示，保持原值；余量只代表采集时状态，未锁定或预订。

Games 仅接公开活动。35 个已暴露工具中未公开自定义游戏积分扣减或自定义券发行；官方抽奖和商城兑换不是自建游戏奖励后端。每局 88 演示积分、原周期与奖励门槛保持。

旧 Party 直连凭据脚本已停用，旧认证配置已移除。当前 `mcp-config.example.json` 仅提供外部宿主参考的环境变量占位符，本项目程序不读取它；它不证明实时连接或认证成功。真实配置须由宿主管理，不得提交。没有查询账户、地址、个人订单或券包；没有下单、取消、领券、绑券、抽奖、兑换、写地址、派对预订或扣真实积分。
