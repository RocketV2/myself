/**
 * 构建期 CJK 字体子集化（predev / prebuild 自动执行）。
 *
 * 为什么：全字重 Noto Serif SC 约 4-6 MB；Google Fonts CDN 在大陆被墙。
 * 本站所有文字都在仓库里（内容 md + 组件模板），子集化后每字重约 100-300 KB，
 * 且 CI 每次构建自动把新增字符并入子集。
 *
 * 流程：扫描 md/astro 源码字符 → subset-font 子集化 400/700 → public/fonts/
 *      → fontkit 解析产物 cmap 做覆盖率检查，<100% 时警告（缺字回退系统字体）。
 */
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';
import * as fontkit from 'fontkit';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONT_DIR = path.join(root, 'node_modules', '@fontsource', 'noto-serif-sc', 'files');
const OUT_DIR = path.join(root, 'public', 'fonts');

const SOURCES = [
  { weight: 400, file: 'noto-serif-sc-chinese-simplified-400-normal.woff2', out: 'serif-400.woff2' },
  { weight: 700, file: 'noto-serif-sc-chinese-simplified-700-normal.woff2', out: 'serif-700.woff2' },
];

/** 安全集：字体实际覆盖的中文标点 + 常用符号 + ASCII 可见字符 + 全角数字。
 *  画线符/emoji 等字体本就不含的字符不入集 —— 真在内容里出现时由覆盖率日志如实报缺。 */
const SAFETY =
  '，。、；：！？「」『』（）—·《》〈〉【】“”‘’%×÷± \n\t' +
  '0123456789０１２３４５６７８９' +
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  '_-/·.,:;!?()[]{}+=#@$%^&*~<>"\'`|\\';

async function walk(dir, exts) {
  const out = [];
  for (const name of await readdir(dir)) {
    const full = path.join(dir, name);
    const stat = await import('node:fs/promises').then((fs) => fs.stat(full));
    if (stat.isDirectory()) out.push(...(await walk(full, exts)));
    else if (exts.includes(path.extname(name))) out.push(full);
  }
  return out;
}

async function collectChars() {
  const files = [
    ...(await walk(path.join(root, 'src', 'content'), ['.md'])),
    ...(await walk(path.join(root, 'src'), ['.astro', '.ts', '.css'])),
  ];
  const chars = new Set(SAFETY);
  for (const f of files) {
    const text = await readFile(f, 'utf8');
    for (const ch of text) chars.add(ch);
  }
  return { files: files.length, chars };
}

async function main() {
  const { files, chars } = await collectChars();
  const text = [...chars].join('');
  console.log(`[subset-font] 扫描 ${files} 个源码文件，共 ${chars.size} 个唯一字符`);

  await mkdir(OUT_DIR, { recursive: true });

  for (const { file, out } of SOURCES) {
    const source = await readFile(path.join(FONT_DIR, file));
    const subset = await subsetFont(source, text, { targetFormat: 'woff2' });
    await writeFile(path.join(OUT_DIR, out), subset);

    // 覆盖率检查：解析产物 cmap，统计缺失字符
    const font = fontkit.create(subset);
    const missing = [];
    for (const ch of text) {
      if (ch === '\n' || ch === '\t') continue;
      if (!font.hasGlyphForCodePoint(ch.codePointAt(0))) missing.push(ch);
    }
    const coverage = (1 - missing.length / chars.size) * 100;
    const kb = (subset.length / 1024).toFixed(0);
    console.log(
      `[subset-font] ${out}: ${kb} KB，覆盖率 ${coverage.toFixed(2)}%` +
        (missing.length > 0 ? `，缺 ${missing.length} 字：${missing.slice(0, 10).join('')}…（回退系统字体）` : ''),
    );
    if (missing.length > 0) {
      console.warn(`[subset-font] ⚠ ${out} 未 100% 覆盖，请确认缺字是否可接受`);
    }
  }
}

main().catch((err) => {
  console.error('[subset-font] 失败：', err);
  process.exit(1);
});
