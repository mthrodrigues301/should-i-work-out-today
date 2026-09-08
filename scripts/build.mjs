import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { build } from "esbuild";
import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, "src");
const publicDirectory = path.join(root, "public");
const output = path.join(root, "dist");
const languages = ["pt", "en", "es", "de", "it", "fr", "ja", "ko", "zh"];
const ogLocales = {
  pt: "pt_BR", en: "en_US", es: "es_ES", de: "de_DE", it: "it_IT",
  fr: "fr_FR", ja: "ja_JP", ko: "ko_KR", zh: "zh_CN"
};

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

function replaceAttribute(html, id, attribute, value) {
  const tagPattern = new RegExp(`<[^>]+id=["']${id}["'][^>]*>`, "i");
  return html.replace(tagPattern, (tag) => {
    const attributePattern = new RegExp(`(${attribute}=["'])[^"']*(["'])`, "i");
    return attributePattern.test(tag)
      ? tag.replace(attributePattern, `$1${escapeHtml(value)}$2`)
      : tag.replace(/>$/, ` ${attribute}="${escapeHtml(value)}">`);
  });
}

function replaceContent(html, id, value) {
  const pattern = new RegExp(`(<[^>]+id=["']${id}["'][^>]*>)[\\s\\S]*?(</[^>]+>)`, "i");
  return html.replace(pattern, `$1${escapeHtml(value)}$2`);
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

await build({
  entryPoints: [path.join(source, "scripts", "analytics.js")],
  bundle: true,
  format: "esm",
  minify: true,
  outfile: path.join(output, "analytics.js"),
  target: ["es2020"]
});

await sharp(path.join(source, "assets", "og-image.svg"))
  .png({ compressionLevel: 9 })
  .toFile(path.join(output, "og-image.png"));

const template = (await readFile(path.join(source, "index.html"), "utf8"))
  .replace(/\s*<script type="importmap">[\s\S]*?<\/script>/, "");
const context = vm.createContext({ window: {} });

for (const language of languages) {
  const localeScript = await readFile(path.join(source, "locales", `${language}.js`), "utf8");
  vm.runInContext(localeScript, context);
}

for (const language of languages) {
  const locale = context.window.WORKOUT_LOCALES[language];
  const [initialMessage, initialSource] = locale.motivations[0];
  const canonical = `https://shouldiworkout.today/${language}`;
  let html = template
    .replace(/<html lang="[^"]+">/, `<html lang="${locale.lang}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(locale.seoTitle)}</title>`);

  html = replaceAttribute(html, "metaDescription", "content", locale.seoDescription);
  html = replaceAttribute(html, "canonicalLink", "href", canonical);
  html = replaceAttribute(html, "ogTitle", "content", locale.seoTitle);
  html = replaceAttribute(html, "ogDescription", "content", locale.seoDescription);
  html = replaceAttribute(html, "ogUrl", "content", canonical);
  html = replaceAttribute(html, "ogLocale", "content", ogLocales[language]);
  html = replaceAttribute(html, "twitterTitle", "content", locale.seoTitle);
  html = replaceAttribute(html, "twitterDescription", "content", locale.seoDescription);
  html = replaceContent(html, "eyebrowText", locale.eyebrow);
  html = replaceContent(html, "answer", locale.yes);
  html = replaceContent(html, "message", initialMessage);
  html = replaceContent(html, "source", `— ${initialSource}`);
  html = replaceContent(html, "instagramCtaText", locale.instagramCta);
  html = html.replace(`<option value="${language}">`, `<option value="${language}" selected>`);

  await writeFile(path.join(output, `${language}.html`), html);
}

await cp(publicDirectory, output, { recursive: true });
await cp(path.join(source, "styles", "main.css"), path.join(output, "styles.css"));
await cp(path.join(source, "scripts", "app.js"), path.join(output, "script.js"));
await mkdir(path.join(output, "assets", "fonts"), { recursive: true });
await cp(
  path.join(root, "node_modules", "@fontsource", "anton", "files", "anton-latin-400-normal.woff2"),
  path.join(output, "assets", "fonts", "anton-latin-400-normal.woff2")
);
await cp(
  path.join(root, "node_modules", "@fontsource", "anton", "LICENSE"),
  path.join(output, "assets", "fonts", "OFL.txt")
);
await cp(path.join(source, "privacy.html"), path.join(output, "privacy.html"));
await cp(path.join(source, "locales"), path.join(output, "locales"), { recursive: true });
await cp(path.join(source, "language-redirect.html"), path.join(output, "index.html"));
await cp(path.join(root, "LICENSE"), path.join(output, "LICENSE"));
await cp(path.join(root, "NOTICE"), path.join(output, "NOTICE"));

console.log(`Built ${languages.length} localized pages in dist/.`);
