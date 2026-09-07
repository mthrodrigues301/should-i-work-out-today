import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
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

const template = await readFile(path.join(root, "index.html"), "utf8");
const context = vm.createContext({ window: {} });

for (const language of languages) {
  const localeScript = await readFile(path.join(root, "locales", `${language}.js`), "utf8");
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
  html = html.replace(`<option value="${language}">`, `<option value="${language}" selected>`);

  await writeFile(path.join(output, `${language}.html`), html);
}

const files = [
  "styles.css", "script.js", "robots.txt", "sitemap.xml", "manifest.webmanifest",
  "favicon.svg", "og-image.svg", "og-image.png", "privacy.html", "LICENSE", "NOTICE"
];
for (const file of files) await cp(path.join(root, file), path.join(output, file));
await cp(path.join(root, "locales"), path.join(output, "locales"), { recursive: true });

console.log(`Built ${languages.length} localized pages in dist/.`);
