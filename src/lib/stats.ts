import type { CollectionEntry } from 'astro:content';

export type ReflectionEntry = CollectionEntry<'reflections'>;
export type MentorEntry = CollectionEntry<'mentors'>;

export function published<T extends { data: { draft?: boolean } }>(entries: T[]): T[] {
  return entries.filter((e) => !e.data.draft);
}

export function sortByDateDesc<T extends { data: { date: Date } }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/* ============ 首页信号带 ============ */

export function pillarCounts(
  reflections: ReflectionEntry[],
  mentors: MentorEntry[],
): { reflections: number; mentors: number } {
  return {
    reflections: published(reflections).length,
    mentors: published(mentors).length,
  };
}

export function latest<T extends { data: { date: Date; draft?: boolean } }>(entries: T[], n: number): T[] {
  return sortByDateDesc(published(entries)).slice(0, n);
}
