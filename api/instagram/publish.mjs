import { getRedis, json } from "../_lib/push.mjs";

const accountId = process.env.INSTAGRAM_ACCOUNT_ID || "17841426213015781";
const graphVersion = process.env.INSTAGRAM_GRAPH_API_VERSION || "v25.0";
const slots = new Set(["en", "bi", "pt"]);
const lockSeconds = 60 * 60 * 24 * 30;

function saoPauloDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function publicationKey(date, slot) {
  return `workout:instagram:publication:${date}:${slot}`;
}

function configured() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const baseUrl = process.env.INSTAGRAM_PUBLIC_BASE_URL;
  if (!token || !baseUrl) throw new Error("Instagram publishing is not configured");
  return { token, baseUrl: baseUrl.replace(/\/$/, "") };
}

async function graph(path, params, token) {
  const response = await fetch(`https://graph.instagram.com/${graphVersion}/${path}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...params, access_token: token })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) {
    const message = body?.error?.message || `Instagram API returned ${response.status}`;
    throw new Error(message);
  }
  return body;
}

async function graphGet(path, params, token) {
  const url = new URL(`https://graph.instagram.com/${graphVersion}/${path}`);
  for (const [key, value] of Object.entries({ ...params, access_token: token })) url.searchParams.set(key, value);
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) throw new Error(body?.error?.message || `Instagram API returned ${response.status}`);
  return body;
}

const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function waitForContainer(containerId, token) {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const state = await graphGet(containerId, { fields: "status_code,status" }, token);
    if (state.status_code === "FINISHED") return;
    if (state.status_code === "ERROR" || state.status_code === "EXPIRED") {
      throw new Error(`Instagram could not prepare the carousel (${state.status_code})`);
    }
    await pause(1500);
  }
  throw new Error("Instagram is still preparing the carousel; publication was not retried automatically");
}

async function loadPost(baseUrl, date, slot) {
  const response = await fetch(`${baseUrl}/social/instagram/daily/${date}/manifest.json`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Prepared assets for ${date} are not publicly available`);
  const manifest = await response.json();
  const post = manifest?.posts?.find(item => item.language === slot);
  if (!post || !Array.isArray(post.files) || post.files.length < 2 || !post.caption) {
    throw new Error(`Prepared ${slot} carousel for ${date} is invalid`);
  }
  return post;
}

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, { error: "Method not allowed" }, 405);
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return json(res, { error: "Unauthorized" }, 401);
  }
  const slot = req.query?.slot;
  if (!slots.has(slot)) return json(res, { error: "Invalid publishing slot" }, 400);

  const date = saoPauloDate();
  const key = publicationKey(date, slot);
  try {
    const { token, baseUrl } = configured();
    const redis = getRedis();
    const acquired = await redis.set(key, JSON.stringify({ state: "preparing", startedAt: new Date().toISOString() }), { nx: true, ex: lockSeconds });
    if (!acquired) return json(res, { status: "skipped", date, slot, reason: "already_started_or_published" });

    try {
      const post = await loadPost(baseUrl, date, slot);
      const children = [];
      for (const file of post.files) {
        const child = await graph(accountId, {
          image_url: `${baseUrl}/social/instagram/daily/${date}/${file}`,
          is_carousel_item: "true"
        }, token);
        if (!child.id) throw new Error("Instagram did not return a carousel item id");
        children.push(child.id);
      }
      const parent = await graph(accountId, {
        media_type: "CAROUSEL",
        children: children.join(","),
        caption: post.caption
      }, token);
      if (!parent.id) throw new Error("Instagram did not return a carousel id");

      await redis.set(key, JSON.stringify({ state: "waiting", containerId: parent.id, startedAt: new Date().toISOString() }), { ex: lockSeconds });
      await waitForContainer(parent.id, token);
      await redis.set(key, JSON.stringify({ state: "publishing", containerId: parent.id, startedAt: new Date().toISOString() }), { ex: lockSeconds });
      const published = await graph(`${accountId}/media_publish`, { creation_id: parent.id }, token);
      if (!published.id) throw new Error("Instagram did not return a published media id");
      await redis.set(key, JSON.stringify({ state: "published", mediaId: published.id, publishedAt: new Date().toISOString() }), { ex: lockSeconds });
      return json(res, { status: "published", date, slot, mediaId: published.id });
    } catch (error) {
      const current = await redis.get(key);
      const state = typeof current === "string" ? JSON.parse(current) : current;
      if (state?.state === "preparing") await redis.del(key);
      console.error("Instagram publication failed", { date, slot, message: error.message });
      return json(res, { error: "Instagram publication failed", date, slot }, 502);
    }
  } catch (error) {
    console.error("Instagram publisher configuration failed", error);
    return json(res, { error: "Instagram publisher is unavailable" }, 500);
  }
}
