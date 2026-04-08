# 迭代设计文档

> 与 [PRD.md](./PRD.md) 配合：PRD 管产品范围，**每个迭代的变更记录放在 [change/](./change/) 下**；**同一自然日宜合并为单文件** `YYYY-MM-DD.md`（见 [change/README.md](./change/README.md)）。  
> 当前产品：**家庭记账**（Next.js 移动端 + Supabase，多家庭编码、登录/创建家、导航刷新 + 读缓存、统计页图表按需加载）。  
> 主文档已与实现对齐时，迭代文件可只记**本轮差异**与发布说明。

## 存放位置

- 目录：`docs/change/`
- 每个迭代新建一个 `.md`（勿把多轮迭代混在同一文件，除非你们约定「仅当前迭代」覆盖更新）。
- 新文件请复制 [change/iteration-template.md](./change/iteration-template.md) 后按 [change/README.md](./change/README.md) 的命名建议改名。
- **索引表**在 [change/README.md](./change/README.md) 维护，便于按时间查找。

## 与主设计文档的关系

| 内容 | 文档 |
|------|------|
| 接口变更与错误码 | [api.md](./api.md) |
| 表结构 / 迁移 | [database-design.md](./database-design.md) |
| 缓存 Key / 策略 | [cache-design.md](./cache-design.md) |

迭代文中以摘要 + 链接为主，避免与主文档长期重复；主文档在里程碑合并后更新「正式版」设计。
