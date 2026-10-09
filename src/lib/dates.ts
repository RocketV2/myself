/**
 * 日期工具。frontmatter 的 YAML 日期经 z.coerce.date() 解析为 UTC 午夜，
 * 全部按 UTC 处理，避免本地时区（UTC+8）造成日偏移。
 */

export function fmtCN(d: Date): string {
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
}
