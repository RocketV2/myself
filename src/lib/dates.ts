/**
 * 日期工具。frontmatter 的 YAML 日期经 z.coerce.date() 解析为 UTC 午夜，
 * 全部按 UTC 处理，避免本地时区（UTC+8）造成日偏移。
 */
const DAY_MS = 86_400_000;

export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function parseKey(key: string): Date {
  return new Date(`${key}T00:00:00Z`);
}

export function fmtCN(d: Date): string {
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
}

/** 图表 x 轴短格式：08-25 */
export function fmtShort(d: Date): string {
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${m}-${day}`;
}

export function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / DAY_MS);
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
