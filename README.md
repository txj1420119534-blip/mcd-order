# 麦麦项目试玩 · 第二轮精修

三个项目已完成第二轮页面、交互与原创图片升级。本分支用于下载、截图审阅和静态网站发布准备；三个源码仓库仍各自在工作区维护，未合并到 main。

## 下载新版

- [统一试玩 ZIP（34.8 MB）](https://github.com/txj1420119534-blip/mcd-order/raw/refs/heads/delivery/demo-packages-20261023/mcd-demo.zip)
- [静态 HTTPS 构建包（26.3 MB）](https://github.com/txj1420119534-blip/mcd-order/raw/refs/heads/delivery/demo-packages-20261023/mcd-static-https.zip)
- [交付说明](报告/交付说明.md) · [浏览器验收](报告/浏览器验收报告.md) · [每仓改动与建议提交](报告/每仓改动与建议提交.md) · [18 张真实截图](预览图/)

如直接下载未开始，请进入 ZIP 文件页点击 Download raw file。私有仓库需要登录有权限的 GitHub 账号。

![实际运行的总入口](preview.png)

## 本轮变化

- 点餐：写实餐品图、详情与购物袋弹窗、加餐时的任务差额提醒、可跳过任务、独立展示本单优惠和下次奖励的结算。
- 派对：成人生日、朋友和同好聚会图片；主题、预算、餐单与时间安排的四步流程，手机操作栏和统一确认弹层。
- 游戏：原创食物、飞船、敌机、道具和场景位图，保留三款原玩法；完善暂停、重试、结算和图片失败恢复。手机推理默认展示完整九列，可切换放大棋盘。
- 美术：本轮实际 imagegen 生成 8 张独立图片，三个仓库保有 9 份文件；完整来源记录随包保留。不声称指定了工具未提供的模型版本。

Node.js v24.19.0 / npm 11.9.0 下，三仓原有与新增测试 109 项、入口与打包检查 5 项全部通过；三项目 build 和 party check 通过。独立最终产物浏览器检查 11 组、351 条断言通过，正常流程零未捕获 JS 错误、零资源加载失败。截图来自真实运行，未把单元测试代替视觉检查。

## 如何试玩

统一包完整解压后，从“麦麦项目试玩/index.html”选择体验，无需 Node、Git、账号或 key。页面内保留独立演示身份、一键重置和历史数据说明。云 Chromium 管理策略阻断真实 file:// 导航；本轮已验证原样单文件内容在阻断其他网络时运行，**目标电脑真实双击仍待手测**，不将其写成已通过。

HTTP 包为总入口与三个独立静态目录，需要通过 HTTP/HTTPS 服务加载，不是双击版。

## 在线网站：文件已备好，尚未验证上线

`docs/` 已包含验证过的 61 个静态文件，也通过 GitHub Pages 项目子路径测试。**推送 docs 不等于 Pages 已启用。**当前环境访问 Pages API 与目标 github.io 域名时被代理 CONNECT 403 阻断，无法读取、启用或验证公开网站。

如选择 GitHub Pages，请打开 [仓库 Pages 设置](https://github.com/txj1420119534-blip/mcd-order/settings/pages)，选择：

1. Build and deployment → Source：Deploy from a branch。
2. Branch：`delivery/demo-packages-20261023`；Folder：`/docs`。
3. 保存，等 GitHub 显示部署完成，再以页面显示的访问地址为准。

预计地址为 `https://txj1420119534-blip.github.io/mcd-order/`；该地址尚未由本环境验证，不作为已上线交付。仓库可见性、套餐与组织策略可能限制 Pages。未加入自动部署工作流，也未改动 main。

## MCP 与模拟边界

当前实际工具没有麦当劳业务 MCP，端点探测被代理阻断，未取得新的实时业务数据。官方 MCP README 提供结构化菜单、价格、活动及部分图片字段，不提供完整官方页面导出。本轮为独立设计实现，并非官方当前页面的逐像素复制。

三个项目仍使用公开只读历史快照和本地模拟；原官方参赛声明与快照保持原文。成人方案不是官方成人可订套餐，儿童商品适用范围保留。没有真实下单、用券、扣积分、预订、发券或付款；未放入个人 key、认证配置、个人数据或追踪统计。实时 MCP 仍需要可用的安全后端及授权渠道，不能把个人 key 塞进静态前端。

## 校验值与旧版

```text
181c23be7cc9a2c510ec2f80066c7f67f160dc15cb6de81869171fb4c1d4489c  mcd-demo.zip (34797947 bytes)
a1e871b838459ff68e87b61b20743276c902fcff1c44fbff7a7865d2a2dcb23c  mcd-static-https.zip (26317010 bytes)
```

最终包的四个离线 HTML 和全部 61 个静态文件均与通过 351 条浏览器断言的版本逐字节一致；最后只追加了报告和 18 张截图。

第一轮仍可按原固定提交下载：[试玩 ZIP](https://github.com/txj1420119534-blip/mcd-order/raw/2881f53d66a6270a6e376c7e99c16d73b477c44e/mcd-demo.zip) · [HTTP ZIP](https://github.com/txj1420119534-blip/mcd-order/raw/2881f53d66a6270a6e376c7e99c16d73b477c44e/mcd-static-https.zip)。
