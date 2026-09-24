import { mkdir, readFile, writeFile, access, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../../', import.meta.url));
const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/instagram/render.mjs <daily-content.json>');
const content = JSON.parse(await readFile(input, 'utf8'));
if (!/^\d{4}-\d{2}-\d{2}$/.test(content.date) || new Date(content.date).toISOString().slice(0, 10) !== content.date) throw new Error('Invalid date');
const out = path.join(root, 'social/instagram/daily', content.date);
const publicOut = path.join(root, 'public/social/instagram/daily', content.date);
const esc = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function text(value, max, label) {
  if (typeof value !== 'string' || !value.trim() || [...value].length > max) throw new Error(`Invalid ${label}, maximum ${max} characters`);
}
for (const lang of ['en', 'bi', 'pt']) {
  const post = content[lang];
  if (!post || !Array.isArray(post.slides) || post.slides.length < 4 || post.slides.length > 6) throw new Error(`${lang}: use 4–6 slides`);
  text(post.caption, 2200, 'caption');
  for (const slide of post.slides) {
    text(slide.kicker, 34, 'kicker');
    if (!Array.isArray(slide.title) || slide.title.length < 1 || slide.title.length > 4) throw new Error('Title requires 1–4 lines');
    slide.title.forEach(line => text(line, 12, 'title line'));
    if (!Array.isArray(slide.body) || slide.body.length < 1 || slide.body.length > 3) throw new Error('Body requires 1–3 lines');
    slide.body.forEach(line => text(line, 43, 'body line'));
  }
}
try { await access(path.join(out, 'manifest.json')); throw new Error('This date already has a finished batch. Use a new date; never overwrite queued posts.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(out, { recursive: true });
const manifest = { date: content.date, account: 'shouldiworkout.today', status: 'prepared', publishing: 'not_connected', posts: [] };
const thumbnails = [];
for (const [row, lang] of ['en', 'bi', 'pt'].entries()) {
  const post = content[lang];
  await mkdir(path.join(out, lang), { recursive: true });
  const files = [];
  for (const [i, slide] of post.slides.entries()) {
    const bg = ['#f1efe8', '#eaff38', '#11110f'][(i + row) % 3];
    const fg = bg === '#11110f' ? '#f1efe8' : '#11110f';
    const titleSize = Math.min(168, Math.floor(920 / (Math.max(...slide.title.map(s => [...s].length)) * .95)));
    const firstY = 575 - (slide.title.length - 1) * titleSize * .51;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">
      <rect width="1080" height="1350" fill="${bg}"/>
      <g font-family="Arial, Helvetica, sans-serif" fill="${fg}" font-weight="900">
      <rect x="72" y="58" width="72" height="72" rx="16" fill="#eaff38"/>
      <path d="M88 114 L128 74 M103 74 H128 V100" fill="none" stroke="#11110f" stroke-width="9"/>
      <text x="164" y="106" font-size="25" letter-spacing="1.5">SHOULD I WORK OUT TODAY?</text>
      <path d="M72 164 H1008 M72 1172 H1008" stroke="${fg}" opacity=".35" stroke-width="2"/>
      <text x="72" y="250" font-size="25" letter-spacing="2">${esc(slide.kicker.toUpperCase())}</text>
      ${slide.title.map((line, j) => `<text x="72" y="${firstY + j * titleSize * 1.02}" font-size="${titleSize}" letter-spacing="-4">${esc(line.toUpperCase())}</text>`).join('')}
      <rect x="72" y="970" width="12" height="130" fill="${bg === '#eaff38' ? '#11110f' : '#eaff38'}"/>
      ${slide.body.map((line, j) => `<text x="112" y="${998 + j * 43}" font-size="29">${esc(line)}</text>`).join('')}
      <text x="72" y="1230" font-size="22">SHOULDIWORKOUT.TODAY</text>
      <text x="72" y="1274" font-size="22">@SHOULDIWORKOUT.TODAY</text>
      <text x="1008" y="1274" font-size="20" text-anchor="end">${lang === 'pt' ? 'PT-BR' : lang === 'bi' ? 'EN + PT-BR' : 'EN'} · ${i + 1}/${post.slides.length}</text>
      </g></svg>`;
    const name = `${String(i + 1).padStart(2, '0')}.jpg`;
    const image = await sharp(Buffer.from(svg)).jpeg({ quality: 94, chromaSubsampling: '4:4:4' }).toBuffer();
    await writeFile(path.join(out, lang, name), image);
    files.push(`${lang}/${name}`);
    thumbnails.push({ input: await sharp(image).resize(270, 338).toBuffer(), left: i * 270, top: row * 338 });
  }
  await writeFile(path.join(out, lang, 'caption.txt'), post.caption + '\n');
  manifest.posts.push({ language: lang, sequence: row + 1, coverColor: ['#f1efe8', '#eaff38', '#11110f'][row], time: ['12:00', '15:00', '18:00'][row], timezone: 'America/Sao_Paulo', timingBasis: 'initial_test_without_insights', files, caption: post.caption });
}
await sharp({ create: { width: Math.max(content.en.slides.length, content.bi.slides.length, content.pt.slides.length) * 270, height: 1014, channels: 3, background: '#77766f' } }).composite(thumbnails).jpeg({ quality: 90 }).toFile(path.join(out, 'preview.jpg'));
await writeFile(path.join(out, 'content.json'), JSON.stringify(content, null, 2) + '\n');
await writeFile(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
await mkdir(path.dirname(publicOut), { recursive: true });
await cp(out, publicOut, { recursive: true, force: true });
await Promise.all([
  rm(path.join(publicOut, 'content.json'), { force: true }),
  rm(path.join(publicOut, 'preview.jpg'), { force: true }),
  rm(path.join(publicOut, 'qa.json'), { force: true }),
  ...['en', 'bi', 'pt'].map(lang => rm(path.join(publicOut, lang, 'caption.txt'), { force: true }))
]);
console.log(`Prepared three carousels: ${out}. Nothing published. Public publishing assets: ${publicOut}.`);
