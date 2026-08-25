/**
 * base 纪律：全站内部链接一律走 p()，不得手写绝对路径。
 * 项目页 base = '/<repo>/'，用户页 base = '/'，此处自动适配。
 */
export const base = import.meta.env.BASE_URL;

/** 拼接站点内绝对路径（自动挂 base、去掉多余的 /） */
export function p(path: string): string {
  return `${base}${path.replace(/^\//, '')}`;
}

/** 站外链接（不动） */
export function ext(url: string): string {
  return url;
}
