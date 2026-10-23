# 在 Netlify 发布已验收的试玩版

这个交付分支包含可直接托管的静态成品。根目录的 `netlify.toml` 已指定发布 `docs/`，无需 npm 安装或构建命令。它不会改动三个源码仓库或 main。

## 在你的账号创建一个独立试玩项目

1. 登录 https://app.netlify.com/，选择你的团队，进入从 Git 导入项目的入口。
2. 连接 GitHub，选择 `txj1420119534-blip/mcd-order`。
3. 将部署分支改为 `delivery/demo-packages-20261023`，不要选择 main。
4. Base directory 留空；Build command 留空；Publish directory 为 `docs`（配置文件已经提供）。
5. 发起部署，等待 Netlify 显示发布成功，再打开它分配的 `https://…netlify.app` 地址。

这是新建独立试玩站点的路径；无需替换你已有的生产网站。若你希望更新某个已有站点，应先确认该站点就是本项目的发布目标。

## 发布后核对

首页应显示三个图文卡片。依次打开点餐、派对、游乐局，确认图片可见、任务差额弹窗可操作、手机页面无横向溢出，重置后能重新试玩。三项目入口分别是：

- `/mcd-order/index.html`
- `/mcd-party/index.html`
- `/mcd-games/index.html`

无需 SPA 重写规则、服务端函数或个人 key。缺失页面由随附 `404.html` 处理；不要添加将所有路径重写到首页的规则。

## 当前验证与阻塞

部署目录包含 61 文件、28,218,099 字节，全部与通过 11 组、351 条浏览器断言的版本逐字节一致；根路径及项目子路径均已在本地 HTTP 中验收。配置添加没有修改运行文件或两个下载 ZIP。

2026-10-23 的云环境检查结果：当前工具列表没有 Netlify 连接器，未安装 Netlify CLI，没有可用 Netlify 认证环境变量或站点绑定。访问 `api.netlify.com` 和 `app.netlify.com` 均在环境代理 CONNECT 阶段被 403 拦截。因此本次只完成发布准备，未创建 Netlify 站点或获得经过验证的公开网址。这个错误不是 Netlify 对账号授权的判定。

不要把个人 Token 发到聊天、写入仓库或放到前端。网站继续使用官方公开只读历史快照与本地模拟；Netlify 静态托管本身不会接通实时 MCP，也不会执行真实消费。
