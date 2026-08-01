import themesData from '../data/themes.json';
import crosslinks from '../data/crosslinks.json';
import tensions from '../data/tensions.json';
import art from '../data/coverart.json';

export const THEMES = themesData.themes;
export const THEME_BY_KEY = Object.fromEntries(THEMES.map((t) => [t.key, t]));
export const CROSSLINKS = crosslinks;
export const TENSIONS = tensions;
export const ART = art;

export const pad = (n) => String(n).padStart(3, '0');

export const coverFor = (episode) => art[String(episode)] || null;

export const fmtDate = (d) =>
  d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

/** Stable slug for a guest name, used for /guests/{slug}/ */
export const guestSlug = (name) =>
  name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Build the guest index from the episode collection. */
export function buildGuests(episodes) {
  const map = new Map();
  for (const ep of episodes) {
    for (const g of ep.data.guests) {
      const s = guestSlug(g.name);
      if (!map.has(s))
        map.set(s, { slug: s, name: g.name, title: g.title, firm: g.firm, linkedin: g.linkedin, episodes: [] });
      const rec = map.get(s);
      // prefer the most complete credential we have seen
      if (!rec.title && g.title) rec.title = g.title;
      if (!rec.firm && g.firm) rec.firm = g.firm;
      if (!rec.linkedin && g.linkedin) rec.linkedin = g.linkedin;
      rec.episodes.push(ep);
    }
  }
  for (const rec of map.values())
    rec.episodes.sort((a, b) => a.data.episode - b.data.episode);
  return [...map.values()].sort((a, b) => {
    const la = a.name.split(' ').at(-1);
    const lb = b.name.split(' ').at(-1);
    return la.localeCompare(lb);
  });
}

/** Tensions that involve a given episode. */
export function tensionsFor(episode) {
  return TENSIONS.filter((t) => (t.episodes || []).includes(episode));
}

/** Tensions where every side sits inside the given theme's episode set. */
export function tensionsForTheme(themeKey) {
  const eps = new Set(THEME_BY_KEY[themeKey]?.episodes || []);
  return TENSIONS.filter((t) => (t.episodes || []).some((e) => eps.has(e)));
}

export const LINK_LABEL = {
  tension: 'Tension',
  sequence: 'Sequence',
  'same-theme': 'Same theme',
};
