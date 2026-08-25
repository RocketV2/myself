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
 * 板块二：A股超短复盘 —— 一个集合 + type 判别字段（不拆两个集合）：
 * 胜率 / 连续记录 / 情绪曲线都要一条统一按日期排序的数据流，
 * 拆开会让每个聚合函数做合并，零收益。
 * 情绪周期为封闭域，用 enum；trades 带默认值，聚合永远安全。
 */
const reviews = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/reviews' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(), // daily = 当日；weekly = 该周周一
    type: z.enum(['daily', 'weekly']),

    cyclePhase: z.enum(['冰点', '启动', '发酵', '高潮', '退潮']),
    cycleDay: z.number().int().min(1).optional(), // 周期内第几天（情绪曲线平滑度依赖它）

    maxBoard: z.number().int().min(0).optional(), // 最高连板数
    maxBoardStock: z.string().optional(), // 最高板个股
    themes: z.array(z.string()).default([]), // 主线题材

    trades: z
      .array(
        z.object({
          stock: z.string().optional(),
          type: z.enum(['打板', '半路', '低吸', '其他']),
          result: z.enum(['win', 'loss', 'hold', 'none']), // win/loss 计入胜率；hold = 持仓未结
          pnl: z.number().optional(), // 该笔 ±%
        }),
      )
      .default([]),

    pnl: z.number().optional(), // 当日/当周总盈亏 %
    disciplineScore: z.number().int().min(1).max(5), // 必填 —— 站点主旨
    disciplineNote: z.string().optional(), // 一句话：哪条纪律守住了/破了
    marketContext: z.string().optional(), // 大盘一句话
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/**
 * 板块三：前辈语录 —— 一条语录一个文件；media 支持：
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

export const collections = { reflections, reviews, mentors };
