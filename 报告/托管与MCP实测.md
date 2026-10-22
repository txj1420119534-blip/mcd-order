# 在线托管与 MCP 能力核对

记录日期：2026-10-23（Asia/Singapore）。本报告只记录本轮实际读取与调用结果；未进行托管配置或外部写入。

## GitHub Pages

实际执行 `gh api repos/txj1420119534-blip/mcd-order` 以及同仓库 `/pages` 接口，均返回 `Forbidden`。当前无法读取仓库 Pages 设置或管理员权限，不能将此错误解释为 Pages 未启用。

Git 只读传输成功：远端存在 `main` 与 `delivery/demo-packages-20261023`，本次检查未发现 `gh-pages` 分支。现有交付分支 HEAD 为 `2881f53d66a6270a6e376c7e99c16d73b477c44e`。

尝试读取 `https://txj1420119534-blip.github.io/mcd-order/` 时，环境代理在连接阶段返回 `403 Forbidden`，未获得远端网页内容。这不等同于网站返回 404，也不能作为已上线或未上线的证据。

独立准备了 `scripts/prepare-pages.mjs`：将三个静态构建与统一入口整理到 `GitHub-Pages待发布/docs/`，生成文件哈希记录。脚本没有 Git 提交、推送、API 请求、部署步骤。建议复用既有交付分支的 `docs/`，避免新增项目源码分支。

### 仅通过 Git 推送能否自动启用 Pages？

不能保证。实际 HTTP 200 读取 GitHub 官方 `actions/configure-pages` 的 `action.yml`，其 `enablement` 说明明确：

> This option requires a token other than `GITHUB_TOKEN` to be provided.

该说明继续要求 PAT 具备 `repo` scope 或 Pages write；GitHub App 具备 `administration:write` 与 `pages:write`。因此，把工作流推到新分支并依赖默认 `GITHUB_TOKEN`，不能被宣称为必然能首次启用 Pages 的办法。

官方 `actions/deploy-pages` 文档还要求 `pages: write`、`id-token: write`，并受 `github-pages` 环境保护与发布源/分支规则影响。仓库管理员应先在 Pages 设置中选择实际发布源；本轮没有索取或写入任何个人 Token。

官方只读依据（均实际 HTTP 200）：

- https://raw.githubusercontent.com/actions/configure-pages/main/action.yml
- https://raw.githubusercontent.com/actions/configure-pages/main/README.md
- https://raw.githubusercontent.com/actions/deploy-pages/main/README.md

## 麦当劳 MCP

当前实际可调用工具中没有麦当劳业务查询工具。本轮没有新的认证成功、实时查询或业务调用结果，仍保持随附公开历史快照与本地模拟。

已实际 HTTP 200 读取官方说明：

- https://github.com/M-China/mcd-mcp-server
- https://raw.githubusercontent.com/M-China/mcd-mcp-server/main/README.md

官方说明将 MCP 定义为数据交互接口，采用 `https://mcp.mcd.cn` 的 Streamable HTTP 与 Bearer 授权。公开工具表包含餐品菜单、商品详情、价格计算、活动查询、商城商品图片与说明、派对日期场次等结构化业务能力；本次读取的表中未提供完整官方点餐页面 HTML 或应用截图导出工具。

所以可以借助已授权的只读查询更新真实数据或商品信息，但不能把“接通 MCP”直接等同于“取得官方原版页面”。本轮设计仍为独立实现；真实快照日期、儿童商品适用范围和模拟奖励身份应继续保留。

静态前端不得内置个人 Token。若要给公开链接增加实时 MCP，需要独立服务端、安全授权管理、只读工具白名单、响应校验与明确失败状态；这些服务与权限当前未可用，不应使用静默 mock 回退冒充调用成功。
