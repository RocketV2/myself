/**
 * SVG 几何纯函数 —— 手写图表零运行时依赖（构建期渲染）。
 */

export interface SeriesPoint {
  label: string;
  value: number;
  sub?: string;
}

export interface BarDatum {
  label: string;
  value: number;
}

export interface Pt {
  x: number;
  y: number;
}

/** 值域到像素域的线性比例尺 */
export function linearScale(domain: [number, number], range: [number, number]): (v: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (v: number) => r0 + (v - d0) * k;
}

/** 折线路径 */
export function linePath(pts: Pt[]): string {
  if (pts.length === 0) return '';
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  }
  return d;
}

/** 阶梯线路径（先横后竖）—— 情绪周期曲线 */
export function steppedPath(pts: Pt[]): string {
  if (pts.length === 0) return '';
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` H ${pts[i].x.toFixed(1)} V ${pts[i].y.toFixed(1)}`;
  }
  return d;
}
