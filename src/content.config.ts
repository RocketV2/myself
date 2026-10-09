import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * 板块一：感悟反思 —— 日常长文，一文件一篇。
 */
const reflections = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/reflections' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    time: z.string().optional(), // 时刻，如「下午六点」（同日多篇时区分）
    excerpt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/**
 * 板块二：前辈语录 —— 一条语录一个文件；media 支持：
 *   audio/video 本地文件（提交入库，见 README 媒体限制）
 *   embed       B站/YouTube 外链（视频一律走 embed，LFS 在 Pages 不可用）
 */
const mentors = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/mentors' }),
  schema: z.object({
    name: z.string(),
    alias: z.string().optional(),
    quote: z.string(),
    source: z.string().optional(),
    date: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    media: z
      .discriminatedUnion('kind', [
        z.object({ kind: z.literal('audio'), file: z.string() }), // 如 'media/mentors/xxx.m4a'
        z.object({ kind: z.literal('video'), file: z.string() }), // 不推荐，见 README
        z.object({
          kind: z.literal('embed'),
          provider: z.enum(['bilibili', 'youtube']),
          videoId: z.string(),
        }),
      ])
      .optional(),
  }),
});

export const collections = { reflections, mentors };
