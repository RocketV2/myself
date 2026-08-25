/**
 * 按日期模板新建内容文件（不覆盖已存在的文件）。
 *
 *   npm run new:reflection "空仓不是失败"
 *     → src/content/reflections/YYYY-MM-DD-空仓不是失败.md
 *   npm run new:review daily
 *   npm run new:review weekly
 *     → src/content/reviews/{daily|weekly}/YYYY-MM-DD.md（weekly 日期取本周一）
 *
 * 生成的 frontmatter 与 src/content.config.ts 的 Zod schema 严格一致（astro check 保持绿色）。
 */
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(root, 'src', 'content');

function utcDate(offsetDays = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** 本周一（weekly 复盘的 date） */
function utcMonday() {
  const d = new Date();
  const day = d.getUTCDay(); // 0=Sun
  const back = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - back);
  return d.toISOString().slice(0, 10);
}

function slugify(title) {
  const s = title
    .trim()
    .replace(/[^\p{Script=Han}A-Za-z0-9]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return s || 'notes';
}

async function ensureNotExists(file) {
  try {
    await access(file);
    console.error(`✗ 已存在，拒绝覆盖：${path.relative(root, file)}`);
    process.exit(1);
  } catch {
    /* 不存在，继续 */
  }
}

const [, , kind, arg] = process.argv;

if (kind === 'reflection') {
  const title = arg || '无题';
  const slug = slugify(title);
  const file = path.join(CONTENT, 'reflections', `${utcDate()}-${slug}.md`);
  await ensureNotExists(file);
  const tpl = `---
title: ${title}
date: ${utcDate()}
excerpt: 一句话摘要（列表页展示）
tags: []
---

写点什么：盘后安静下来才想明白的事。
`;
  await writeFile(file, tpl, 'utf8');
  console.log(`✓ 已创建：${path.relative(root, file)}`);
} else if (kind === 'review') {
  const type = arg === 'weekly' ? 'weekly' : 'daily';
  const date = type === 'weekly' ? utcMonday() : utcDate();
  await mkdir(path.join(CONTENT, 'reviews', type), { recursive: true });
  const file = path.join(CONTENT, 'reviews', type, `${date}.md`);
  await ensureNotExists(file);
  const weekLabel = type === 'weekly' ? ' · 周复盘' : '';
  const tpl = `---
title: ${date.slice(5).replace('-', '月')}日${weekLabel}
date: ${date}
type: ${type}
cyclePhase: 冰点
${type === 'daily' ? 'cycleDay: 1\n' : ''}maxBoard: 0
themes: []
trades: []
pnl: 0
disciplineScore: 5
disciplineNote: 一句话：哪条纪律守住了/破了。
marketContext: 大盘一句话：量能、连板高度、情绪。
tags: []
---

情绪周期（冰点/启动/发酵/高潮/退潮）今天处于什么位置？为什么？

${type === 'daily' ? '**明日计划**：' : '**下周预案**：'}
`;
  await writeFile(file, tpl, 'utf8');
  console.log(`✓ 已创建：${path.relative(root, file)}`);
} else {
  console.error('用法：node scripts/new-entry.mjs reflection "标题" | node scripts/new-entry.mjs review daily|weekly');
  process.exit(1);
}
