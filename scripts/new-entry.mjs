/**
 * 按日期模板新建内容文件（不覆盖已存在的文件）。
 *
 *   npm run new:reflection "空仓不是失败"
 *     → src/content/reflections/YYYY-MM-DD-空仓不是失败.md
 *
 * 生成的 frontmatter 与 src/content.config.ts 的 Zod schema 严格一致（astro check 保持绿色）。
 */
import { access, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(root, 'src', 'content');

function utcDate(offsetDays = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
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
} else {
  console.error('用法：node scripts/new-entry.mjs reflection "标题"');
  process.exit(1);
}
