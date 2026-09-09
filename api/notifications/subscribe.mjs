import { getRedis, json, SUBSCRIPTIONS_KEY } from "../_lib/push.mjs";

const supportedLanguages = new Set(["pt", "en", "es", "de", "it", "fr", "ja", "ko", "zh"]);

export default async function handler(req, res) {
  if (!["POST", "DELETE"].includes(req.method)) return json(res, { error: "Method not allowed" }, 405);
  try {
    if (req.method === "DELETE") {
      const { endpoint } = req.body || {};
      if (!endpoint) return json(res, { error: "Missing endpoint" }, 400);
      await getRedis().hdel(SUBSCRIPTIONS_KEY, endpoint);
      return json(res, { subscribed: false });
    }
    const { subscription, language } = req.body || {};
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return json(res, { error: "Invalid push subscription" }, 400);
    }
    const record = {
      subscription,
      language: supportedLanguages.has(language) ? language : "en",
      createdAt: new Date().toISOString()
    };
    await getRedis().hset(SUBSCRIPTIONS_KEY, { [subscription.endpoint]: record });
    return json(res, { subscribed: true });
  } catch (error) {
    console.error("Push subscription failed", error);
    return json(res, { error: "Could not update subscription" }, 500);
  }
}
