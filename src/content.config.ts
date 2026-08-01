import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const episodes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/episodes' }),
  schema: z.object({
    episode: z.number().int().positive(),
    slug: z.string().min(1),
    title: z.string().min(1),
    guests: z.array(z.object({
      name: z.string().min(1),
      title: z.string().optional(),
      firm: z.string().optional(),
      linkedin: z.string().url().optional(),
    })).min(1),
    publishDate: z.coerce.date(),
    buzzsproutId: z.union([z.string(), z.number()]).transform(String),
    format: z.string().optional(),
    legacyUrl: z.string().url(),
    hook: z.string().min(1).refine(s => s.trim().split(/\s+/).length <= 15, {
      message: 'hook must be 15 words or fewer',
    }),
    themes: z.array(z.string()).min(1),
    related: z.array(z.object({
      episode: z.number().int().positive(),
      type: z.enum(['same-theme', 'sequence', 'tension']),
      reason: z.string().min(20, 'link reason must be a real sentence'),
    })).min(1),
    transcriptWords: z.number().optional(),
  }),
});

export const collections = { episodes };
