/**
 * Build-time integrity gate. Runs against the built content, not the source
 * of truth it came from, so it catches regressions introduced by editing.
 * Exits non-zero on any defect — wire into `npm run build`.
 */
import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

const DIR = 'src/content/episodes';
const themes = JSON.parse(fs.readFileSync('src/data/themes.json', 'utf8'));
const VALID_THEMES = new Set(themes.themes.map((t) => t.key));

const errors = [];
const eps = new Map();
const slugs = new Map();

for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
  const raw = fs.readFileSync(path.join(DIR, f), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) { errors.push(`${f}: no frontmatter`); continue; }
  let fm;
  try { fm = yaml.load(m[1]); } catch (e) { errors.push(`${f}: YAML ${e.message}`); continue; }
  const body = m[2];

  if (eps.has(fm.episode)) errors.push(`duplicate episode number ${fm.episode}`);
  eps.set(fm.episode, { fm, f, body });
  if (slugs.has(fm.slug)) errors.push(`duplicate slug ${fm.slug}`);
  slugs.set(fm.slug, fm.episode);

  const expect = `${String(fm.episode).padStart(3, '0')}-${fm.slug}.md`;
  if (f !== expect) errors.push(`${f}: filename should be ${expect}`);
  if (!fm.buzzsproutId) errors.push(`${f}: missing buzzsproutId`);
  if (!fm.legacyUrl?.startsWith('https://connection.builders/podcast/'))
    errors.push(`${f}: legacyUrl malformed`);
  if (!fm.hook || fm.hook.trim().split(/\s+/).length > 15)
    errors.push(`${f}: hook missing or >15 words`);
  for (const t of fm.themes || [])
    if (!VALID_THEMES.has(t)) errors.push(`${f}: unknown theme "${t}"`);
  for (const s of ['## Why this episode', '## Guest', '## Key ideas',
                   '## Notable moments', '## Try this', '## Related episodes',
                   '## Themes', '## Transcript'])
    if (!body.includes(s)) errors.push(`${f}: missing section ${s}`);
  if (/\*\*\[\d{2}:\d{2}:\d{2}\]/.test(body.slice(0, body.indexOf('## Transcript'))))
    errors.push(`${f}: timestamp rendered in Notable moments`);
}

// cross-links: bidirectional, matching type, resolvable
for (const [num, { fm, f }] of eps) {
  for (const r of fm.related || []) {
    const target = eps.get(r.episode);
    if (!target) { errors.push(`${f}: links to missing episode ${r.episode}`); continue; }
    const back = (target.fm.related || []).find((x) => x.episode === num);
    if (!back) errors.push(`${f}: link to ${r.episode} is not reciprocated`);
    else if (back.type !== r.type)
      errors.push(`${f}: link type mismatch with ${r.episode} (${r.type} vs ${back.type})`);
    if (!r.reason || r.reason.trim().split(/\s+/).length < 5)
      errors.push(`${f}: link to ${r.episode} has no real reason sentence`);
  }
}

// internal hrefs resolve
const allSlugs = new Set(slugs.keys());
for (const [, { f, body }] of eps) {
  for (const m of body.matchAll(/\]\(\/episodes\/([a-z0-9-]+)\/\)/g))
    if (!allSlugs.has(m[1])) errors.push(`${f}: broken episode link /episodes/${m[1]}/`);
  for (const m of body.matchAll(/\]\(\/themes\/([a-z0-9-]+)\/\)/g))
    if (!VALID_THEMES.has(m[1])) errors.push(`${f}: broken theme link /themes/${m[1]}/`);
}

if (errors.length) {
  console.error(`\n✗ ${errors.length} integrity error(s):\n`);
  for (const e of errors.slice(0, 60)) console.error('  ' + e);
  process.exit(1);
}
console.log(`✓ integrity OK — ${eps.size} episodes, all cross-links bidirectional, all refs resolve`);
