import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
export async function GET(context) {
  const eps = (await getCollection('episodes')).sort((a,b)=>b.data.episode-a.data.episode);
  return rss({
    title: 'Branch Out',
    description: 'Insights from leading middle-market professionals. 112 episodes, 2020–2023.',
    site: context.site,
    items: eps.map(e => ({
      title: `Ep ${String(e.data.episode).padStart(3,'0')} — ${e.data.title}`,
      pubDate: e.data.publishDate,
      description: e.data.hook,
      link: `/episodes/${e.data.slug}/`,
    })),
  });
}
