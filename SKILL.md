# R2 运行与只读宿主桥接

当前执行 README.md、MCP_INTEGRATION.md 与 MCP_CAPABILITIES.md。npm start 运行独立本地 R2 服务；npm test 保留 R1 规则测试，npm run test:r2 校验只读快照，npm run build 生成静态包。原 R1 说明保留于下方作历史参考。

真实查询只经已有授权宿主 MCP 工具完成；前端为时间戳快照与导入器。禁止读取凭据、环境变量值、账户/地址/订单、写操作或发布。只读公开参数来自上游结果。Games 自定义扣分和发券仍模拟。

---

---
name: mcd-order-companion-demo
description: Run and verify a fixture-only Chinese order companion without making real purchases.
---

# Workflow

1. Start with `npm start` and open localhost:4176. All UI is DEMO.
2. Preserve the user's intended food and quantities. Never force additions to reach a reward.
3. Compare final paid totals including delivery and separately identify incremental spend.
4. Permit one product coupon. Goldcard 39-minus-5 checks after-product-coupon/pre-Goldcard food amount. PLUS delivery waiver is separately itemized; all are fixtures.
5. Store task must be claimed before simulation; final food paid >= 28 after all discounts issues a conditional future product coupon in a separate ledger. Never subtract future rewards from current payment.
6. Unavailable data is an error; do not invent prices or successful API calls.
7. Run `npm test`, `npm run build`, and `npm run test:ui` with server running.
8. Read MCP_INTEGRATION.md before any proposed real integration. Never guess tool schemas, save tokens in frontend, or silently fall back from live errors.
