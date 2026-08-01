import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeSections from './src/lib/rehype-sections.mjs';

export default defineConfig({
  site: 'https://branchoutpodcast.com',
  integrations: [sitemap()],
  markdown: { shikiConfig: { theme: 'github-light' }, rehypePlugins: [rehypeSections] },
  build: { format: 'directory' },
});
