# 麦麦项目试玩 · 下载交付

交付日期：2026-10-23（Asia/Singapore）。

本分支只用于下载交付，包含两个 ZIP 和本说明。三个项目的升级源码仍保留在各自工作区；本次仅提交并推送现成构建包，不合并 main，不部署网站。

## 下载

- [统一试玩 ZIP（9,779,962 字节，约 9.8 MB）](https://github.com/txj1420119534-blip/mcd-order/raw/refs/heads/delivery/demo-packages-20261023/mcd-demo.zip)
- [静态 HTTPS 构建包（6,637,751 字节，约 6.6 MB）](https://github.com/txj1420119534-blip/mcd-order/raw/refs/heads/delivery/demo-packages-20261023/mcd-static-https.zip)

如果直接下载链接未打开，可进入对应 ZIP 的文件页，点击 Download raw file。私有仓库需要先登录有权限的 GitHub 账号。

也可以在本分支页面使用 Code → Download ZIP；得到的仓库压缩包中包含上述两个独立 ZIP。

## 怎么试玩

统一试玩包解压后，先读“先看这里.txt”。“麦麦项目试玩/index.html”为总入口，内含点餐助手、派对策划和游乐局。试玩身份、交易、奖励与方案均为本地演示，无需登录或输入 key，不执行真实消费。

单文件页面已内联脚本、样式、图片与历史快照，并完成断网内容测试。**真实 file:// 双击验收仍未完成**：当前云 Chromium 管理策略阻止该协议，尚需在 Windows/macOS 浏览器中实测。不能将断网内容测试等同于已通过目标电脑的双击测试；如遇问题，请保留错误信息。

静态 HTTPS 包包含三个项目各自独立的构建目录和总入口，供后续静态托管使用；本次没有进行部署。HTTP/HTTPS 构建包需要通过网站服务加载，不应将它当作双击离线版。

包内保留真实浏览器截图、测试报告、美术来源和未完成项。原有检查及新增测试共 98 项通过，三项目构建和 party check 通过；浏览器 9 组、209 个断言通过。实际环境为 Node.js 24.19.0 / npm 11.9.0。

## 真实与模拟边界

官方 CONTEST_DECLARATION.md 在包内保持原文。真实数据仅为随附官方公开只读历史快照，不代表当前价格、场次或可订承诺。成人聚会方案是本地模拟，官方儿童商品保留原适用范围。所有下单、用券、扣积分、奖励与预订演示均不执行真实接口；导入失败保留现有快照并明确报错。

## SHA256 校验

```text
828f905a607870ed64bc77c81651ab85d9e4dd5acaf85cc9d7f511db23f7e089  mcd-demo.zip
97dc491df8c77cfd33756ed6e6ff646641e07fceca6d9fad11198b0f42afbe6c  mcd-static-https.zip
```

两个包与云工作区最终验收产物逐字节一致，没有因本次导出重新生成。
