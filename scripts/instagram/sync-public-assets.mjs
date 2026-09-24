import { access, cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "social", "instagram", "daily");
const destination = path.join(root, "public", "social", "instagram", "daily");

try {
  await access(source);
} catch {
  throw new Error("No prepared Instagram batches found in social/instagram/daily.");
}

await mkdir(destination, { recursive: true });
for (const entry of await readdir(source, { withFileTypes: true })) {
  if (!entry.isDirectory() || !/^\d{4}-\d{2}-\d{2}$/.test(entry.name)) continue;
  const target = path.join(destination, entry.name);
  await cp(path.join(source, entry.name), target, { recursive: true, force: true });
  await Promise.all([
    rm(path.join(target, "content.json"), { force: true }),
    rm(path.join(target, "preview.jpg"), { force: true }),
    rm(path.join(target, "qa.json"), { force: true }),
    ...["en", "bi", "pt"].map(language => rm(path.join(target, language, "caption.txt"), { force: true }))
  ]);
}
console.log("Instagram publishing assets are available under public/social/instagram/daily.");
