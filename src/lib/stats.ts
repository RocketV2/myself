import type { CollectionEntry } from 'astro:content';
import type { BarDatum, SeriesPoint } from './charts';
import { dayKey, diffDays, fmtShort, parseKey } from './dates';

export type ReviewEntry = CollectionEntry<'reviews'>;
export type ReflectionEntry = CollectionEntry<'reflections'>;
export type MentorEntry = CollectionEntry<'mentors'>;

/** 情绪周期到数值的映射。注意：这是波形不是排名 —— 退潮(4) 高于高潮(3) 是有意为之，
 *  曲线上用相位标注防误读；若改为类别轴只需改 emotionSeries 一处。 */
export const PHASE_VALUE = {
  冰点: 0,
  启动: 1,
  发酵: 2,
  高潮: 3,
  退潮: 4,
} as const;

export type Phase = keyof typeof PHASE_VALUE;

export function published<T extends { data: { draft?: boolean } }>(entries: T[]): T[] {
  return entries.filter((e) => !e.data.draft);
}

export function sortByDateAsc<T extends { data: { date: Date } }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
}

export function sortByDateDesc<T extends { data: { date: Date } }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/* ============ 情绪周期曲线（仅 daily 复盘） ============ */

export function emotionSeries(reviews: ReviewEntry[]): SeriesPoint[] {
  return sortByDateAsc(published(reviews).filter((r) => r.data.type === 'daily')).map((r) => ({
    label: fmtShort(r.data.date),
    value: PHASE_VALUE[r.data.cyclePhase] * 10 + (r.data.cycleDay ?? 1),
    sub: r.data.cyclePhase,
  }));
}

export function emotionOverview(reviews: ReviewEntry[]): { phase: Phase | null; maxBoard: number } {
  const daily = sortByDateAsc(published(reviews).filter((r) => r.data.type === 'daily'));
  const maxBoard = daily.reduce((m, r) => Math.max(m, r.data.maxBoard ?? 0), 0);
  const latest = daily[daily.length - 1];
  return { phase: latest ? latest.data.cyclePhase : null, maxBoard };
}

/* ============ 纪律趋势（daily + weekly 各计一条记录） ============ */

export function disciplineSeries(reviews: ReviewEntry[]): SeriesPoint[] {
  return sortByDateAsc(published(reviews)).map((r) => ({
    label: fmtShort(r.data.date),
    value: r.data.disciplineScore,
    sub: r.data.type === 'weekly' ? '周' : undefined,
  }));
}

/* ============ 胜率（仅 daily 复盘的已了结交易） ============ */

export interface WinRateStats {
  total: number; // 已了结交易笔数
  wins: number;
  losses: number;
  rate: number | null; // 0-100
  rolling: SeriesPoint[]; // 7 日滚动胜率
}

export function winRateStats(reviews: ReviewEntry[]): WinRateStats {
  const daily = sortByDateAsc(published(reviews).filter((r) => r.data.type === 'daily'));
  let wins = 0;
  let losses = 0;
  const dayRates: Array<number | null> = [];

  for (const r of daily) {
    const closed = r.data.trades.filter((t) => t.result === 'win' || t.result === 'loss');
    const w = closed.filter((t) => t.result === 'win').length;
    const l = closed.filter((t) => t.result === 'loss').length;
    wins += w;
    losses += l;
    dayRates.push(closed.length > 0 ? (w / closed.length) * 100 : null);
  }

  // 7 日滚动：窗口内所有有数据的日均值
  const rolling: SeriesPoint[] = daily.map((r, i) => {
    const from = Math.max(0, i - 6);
    const windowRates = dayRates.slice(from, i + 1).filter((v): v is number => v !== null);
    const avg = windowRates.length > 0 ? windowRates.reduce((s, v) => s + v, 0) / windowRates.length : null;
    return { label: fmtShort(r.data.date), value: avg ?? 0 };
  });

  return {
    total: wins + losses,
    wins,
    losses,
    rate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : null,
    rolling,
  };
}

/* ============ 交易类型统计（仅 daily） ============ */

export function tradeCounts(reviews: ReviewEntry[]): BarDatum[] {
  const daily = published(reviews).filter((r) => r.data.type === 'daily');
  const counts: Record<string, number> = { 打板: 0, 半路: 0, 低吸: 0, 其他: 0 };
  for (const r of daily) {
    for (const t of r.data.trades) counts[t.type] += 1;
  }
  return Object.entries(counts).map(([label, value]) => ({ label, value }));
}

/* ============ 连续记录 ============
 * 语义：合并感悟 + 复盘日期（weekly 计其周一），按自然日去重。
 * 若最近一条已停更（不到今天），返回「截至」的 run 而非误导性的 0。 */

export interface Streak {
  days: number;
  end: Date; // run 的结束日
}

function mergedDayKeys(reflections: ReflectionEntry[], reviews: ReviewEntry[]): string[] {
  const keys = new Set<string>();
  for (const e of reflections) keys.add(dayKey(e.data.date));
  for (const e of reviews) keys.add(dayKey(e.data.date));
  return [...keys].sort();
}

function currentRun(keys: string[]): Streak {
  if (keys.length === 0) return { days: 0, end: new Date(0) };
  const end = parseKey(keys[keys.length - 1]);
  let days = 1;
  for (let i = keys.length - 2; i >= 0; i--) {
    const prev = parseKey(keys[i]);
    if (diffDays(end, prev) === days) days += 1;
    else break;
  }
  return { days, end };
}

function longestRun(keys: string[]): Streak {
  if (keys.length === 0) return { days: 0, end: new Date(0) };
  let best: Streak = { days: 1, end: parseKey(keys[0]) };
  let run = 1;
  for (let i = 1; i < keys.length; i++) {
    const prev = parseKey(keys[i - 1]);
    const cur = parseKey(keys[i]);
    if (diffDays(cur, prev) === 1) {
      run += 1;
      if (run > best.days) best = { days: run, end: cur };
    } else {
      run = 1;
    }
  }
  return best;
}

export function streakStats(reflections: ReflectionEntry[], reviews: ReviewEntry[]): {
  current: Streak;
  longest: Streak;
} {
  const keys = mergedDayKeys(reflections, reviews);
  return { current: currentRun(keys), longest: longestRun(keys) };
}

/* ============ 首页信号带 ============ */

export function pillarCounts(
  reflections: ReflectionEntry[],
  reviews: ReviewEntry[],
  mentors: MentorEntry[],
): { reflections: number; reviews: number; mentors: number } {
  return {
    reflections: published(reflections).length,
    reviews: published(reviews).length,
    mentors: published(mentors).length,
  };
}

export function latest<T extends { data: { date: Date; draft?: boolean } }>(entries: T[], n: number): T[] {
  return sortByDateDesc(published(entries)).slice(0, n);
}
