# 找到自己 · 重塑自己

个人实修日志站：记录日常感悟反思、每日/每周 A 股超短复盘、收藏的前辈语录。托管于 GitHub Pages，主题「找到自己、重塑自己」，视觉调性「深空 · 极简禅」。

## 三个板块

| 板块 | 目录 | 说明 |
|---|---|---|
| 01 · 感悟反思 | `src/content/reflections/` | 日常长文，一文件一篇 |
| 02 · 超短复盘 | `src/content/reviews/daily/` `src/content/reviews/weekly/` | 结构化字段 + 自动汇总图表（情绪周期曲线 / 纪律趋势 / 胜率 / 交易类型） |
| 03 · 前辈语录 | `src/content/mentors/` | 语录 + 音视频（本地文件或 B 站/YouTube 嵌入） |

首页自动统计：各板块篇数、连续记录天数（感悟 + 复盘合并计算）。

## 技术栈

Astro 7（静态构建）+ Markdown 内容集合 + 手写内联 SVG 图表（零运行时依赖）。
字体自托管：`@fontsource/noto-serif-sc`（思源宋体）构建期子集化到 `public/fonts/`（每字重约 130 KB），无任何 Google/外网 CDN 依赖，大陆直连可用。

## 写作工作流

```bash
npm install

# 新建一篇感悟
npm run new:reflection "空仓不是失败"
# 新建每日/每周复盘（weekly 日期自动取本周一）
npm run new:review daily
npm run new:review weekly

# 本地预览（字体子集会随 dev/build 自动重新生成）
npm run dev
```

发布 = 写一个 md 文件 → commit → push（GitHub Actions 自动构建部署）。

- 文件命名：感悟 `YYYY-MM-DD-标题.md`；复盘 `daily/YYYY-MM-DD.md`、`weekly/YYYY-MM-DD.md`（date 写周一）。
- frontmatter 字段见 `src/content.config.ts` 的 Zod schema（`npm run check` 做类型校验，保持绿色）。
- 复盘必填字段：`type`、`cyclePhase`（冰点/启动/发酵/高潮/退潮）、`disciplineScore`（1-5）。`cycleDay`（周期内第几天）强烈建议填写 —— 情绪曲线平滑度依赖它。
- 想写草稿：加 `draft: true`，构建时跳过。

## 音视频媒体限制（重要）

- **单文件**：50 MiB 警告 / 100 MiB 硬上限；仓库总大小建议 ≤ 1 GB；Pages 站点 ≤ 1 GB，带宽软限 100 GB/月。
- **音频**：语录音频可直接入库（96kbps mp3/m4a 约 0.7 MB/分钟），建议单个 ≤ 25 MB。放 `public/media/mentors/`，frontmatter 写 `media: { kind: audio, file: media/mentors/xxx.m4a }`。
- **视频一律不入库**：用 `media: { kind: embed, provider: bilibili, videoId: BVxxxx }` 嵌入 B 站（`youtube` 亦可）。
- **禁止 Git LFS**：GitHub Pages 不提供 LFS 文件，LFS 大文件在站点上会 404。大于 100 MiB 的资产一律上传 B 站后嵌入。

## 部署到 GitHub Pages

1. 修改 `astro.config.mjs`：`site` 换成 `https://<你的用户名>.github.io`；项目页（`<用户名>.github.io/<仓库名>/`）保留 `base: '/<仓库名>/'`，用户页删除 base 一行。
2. 推送到 GitHub（main 分支），`.github/workflows/deploy.yml` 自动构建部署。
3. 仓库 Settings → Pages → Build and deployment → Source 选 **GitHub Actions**。
4. 等待 workflow 完成，访问 `https://<用户名>.github.io/<仓库名>/`。

## 常用命令

```bash
npm run dev       # 本地开发（自动重新子集化字体）
npm run build     # 构建到 dist/（构建前自动子集化字体并输出覆盖率日志）
npm run preview   # 以生产构建本地预览（带 base 路径）
npm run check     # 内容 vs Zod schema 类型检查
```

`npm run build` 时关注 `[subset-font]` 覆盖率日志：若新内容用到子集外的生僻字，会如实报缺（缺字回退系统字体渲染，不影响显示），可按需在 `scripts/subset-font.mjs` 的安全集里补充。
