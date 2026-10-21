# R2 测试结果

验证时间 2026-10-19T16:55:47.628Z，Windows / Node v24.14.0 / 隔离 Chromium。

- 原 R1 核心逻辑测试 29/29 通过；R2 契约/投影/关联/只读 HTTP 测试 6/6 通过。HTTP 回环测试首轮被沙箱 EACCES 阻止，允许本机回环后复测通过；没有业务逻辑失败残留。
- stdin normalizer 成功生成与随附数据一致的快照；401 业务失败拒绝且不覆盖已有输出。
- npm run build 与新模块语法检查通过。
- 三项目浏览器共 49 项断言通过（另 1 条为按钮文字记录），无 pageerror、无外部请求。覆盖所有真实面板、筛选、坏 JSON/失败状态/有效导入、来源未核验提示、320/390px 无溢出、点单奖励、Party 流程、游戏 88 演示积分与刷新幂等。
- 桌面与手机端视觉 QA 已完成；浏览器截图仅保留在本机 QA，不随包交付。真实数据仅为采集快照。初次浏览器测试有文件读取异步等待的误报，补充校验中状态与等待后通过。
- 未改变原规则/引擎文件（见 R2_SOURCE_MANIFEST.json 的 preservedCore）；未发布，未执行任何真实写操作。

## 本项目引用的真实调用

- campaign_calendar: 2026-10-19T16:39:50.178Z, isError=false / success=true / code=200, traceRef=0a94de4e
- query_nearby_stores: 2026-10-19T16:39:50.179Z, isError=false / success=true / code=200, traceRef=00e64e4a
- query_meals: 2026-10-19T16:40:26.934Z, isError=false / success=true / code=200, traceRef=24e63a96
- calculate_price: 2026-10-19T16:43:26.690Z, isError=false / success=true / code=200, traceRef=4e11ace6

Games 复用同一次公开日历调用，因此三个项目引用 10 条记录，实际只读调用总数是 9，不重复计数。HTTP 与 JSON-RPC 底层状态未由宿主暴露。

R1 历史 QA 文件保留但不代表 R2 当前验证。真实购物车结算、成人官方派对适用性、游戏自定义扣分/发券仍未验证或未支持。
