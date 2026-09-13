import { createHash } from "node:crypto";
import { configureWebPush, getRedis, json, SUBSCRIPTIONS_KEY } from "../_lib/push.mjs";
import { getMotivations } from "../_lib/motivations.mjs";
import webpush from "web-push";

const notificationHours = [8, 18];
const fallbackTimeZone = "America/Sao_Paulo";

function localDateParts(timeZone, scheduledHour) {
  const scheduledTime = new Date();
  scheduledTime.setUTCHours(scheduledHour, 0, 0, 0);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23"
  }).formatToParts(scheduledTime);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function messageForSlot(messages, language, dateParts, localHour) {
  const day = Math.floor(Date.UTC(
    Number(dateParts.year),
    Number(dateParts.month) - 1,
    Number(dateParts.day)
  ) / 86400000);
  const slot = notificationHours.indexOf(localHour);
  const languageOffset = ["pt", "en", "es", "de", "it", "fr", "ja", "ko", "zh"].indexOf(language);
  const sequence = day * notificationHours.length + slot;
  const index = ((sequence * 17) + Math.max(languageOffset, 0) * 7) % messages.length;
  return messages[index];
}

function deliveryKey(endpoint, dateParts, localHour) {
  const subscriptionId = createHash("sha256").update(endpoint).digest("hex").slice(0, 24);
  return `workout:push-delivery:${subscriptionId}:${dateParts.year}-${dateParts.month}-${dateParts.day}:${localHour}`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, { error: "Method not allowed" }, 405);
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return json(res, { error: "Unauthorized" }, 401);
  }
  const scheduledHour = Number(req.query?.hour);
  if (!Number.isInteger(scheduledHour) || scheduledHour < 0 || scheduledHour > 23) {
    return json(res, { error: "Invalid scheduled hour" }, 400);
  }
  try {
    configureWebPush();
    const redis = getRedis();
    const motivations = await getMotivations();
    const records = await redis.hgetall(SUBSCRIPTIONS_KEY) || {};
    let sent = 0;
    let skipped = 0;
    let removed = 0;
    for (const [endpoint, stored] of Object.entries(records)) {
      const record = typeof stored === "string" ? JSON.parse(stored) : stored;
      const language = motivations[record.language] ? record.language : "en";
      const timeZone = record.timeZone || fallbackTimeZone;
      let dateParts;
      try {
        dateParts = localDateParts(timeZone, scheduledHour);
      } catch {
        dateParts = localDateParts(fallbackTimeZone, scheduledHour);
      }
      const localHour = Number(dateParts.hour);
      if (!notificationHours.includes(localHour)) {
        skipped += 1;
        continue;
      }
      const key = deliveryKey(endpoint, dateParts, localHour);
      const acquired = await redis.set(key, "1", { nx: true, ex: 172800 });
      if (!acquired) {
        skipped += 1;
        continue;
      }
      const payload = JSON.stringify({
        title: "Should I Work Out Today?",
        body: messageForSlot(motivations[language], language, dateParts, localHour),
        url: `https://shouldiworkout.today/${language}`,
        icon: "/assets/images/icon-192.png",
        badge: "/assets/images/icon-192.png"
      });
      try {
        await webpush.sendNotification(record.subscription, payload);
        sent += 1;
      } catch (error) {
        if ([404, 410].includes(error.statusCode)) {
          await redis.hdel(SUBSCRIPTIONS_KEY, endpoint);
          removed += 1;
        } else {
          await redis.del(key);
          console.error("Push delivery failed", error);
        }
      }
    }
    return json(res, { sent, skipped, removed, scheduledHour });
  } catch (error) {
    console.error("Daily push failed", error);
    return json(res, { error: "Could not send notifications" }, 500);
  }
}
