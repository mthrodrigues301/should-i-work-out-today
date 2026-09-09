import { configureWebPush, getRedis, json, SUBSCRIPTIONS_KEY } from "../_lib/push.mjs";
import webpush from "web-push";

const messages = {
  pt: ["Você não precisa estar com vontade. Só precisa começar.", "Hoje não precisa ser recorde. Precisa ser presença.", "Um treino curto ainda é uma vitória completa."],
  en: ["You don't need to feel ready. You just need to start.", "Today doesn't need to be a record. Just show up.", "A short workout is still a complete victory."],
  es: ["No necesitas tener ganas. Solo necesitas empezar.", "Hoy no tiene que ser un récord. Solo tienes que aparecer.", "Un entrenamiento corto sigue siendo una victoria."],
  de: ["Du musst nicht motiviert sein. Du musst nur anfangen.", "Heute zählt kein Rekord, sondern dass du da bist.", "Auch ein kurzes Training ist ein voller Erfolg."],
  it: ["Non devi averne voglia. Devi solo iniziare.", "Oggi non serve un record. Basta esserci.", "Anche un allenamento breve è una vittoria."],
  fr: ["Pas besoin d'en avoir envie. Il suffit de commencer.", "Aujourd'hui, pas besoin de record. Sois simplement présent.", "Même un entraînement court est une vraie victoire."],
  ja: ["やる気を待たなくていい。まず始めよう。", "今日は記録より、やることに意味がある。", "短いトレーニングでも立派な一歩。"],
  ko: ["의욕을 기다리지 마세요. 그냥 시작하세요.", "오늘은 기록보다 참여가 중요합니다.", "짧은 운동도 완전한 승리입니다."],
  zh: ["不必等到有动力，现在就开始。", "今天不必破纪录，只要行动。", "短暂的锻炼也是完整的胜利。"]
};

function dailyMessage(language) {
  const list = messages[language] || messages.en;
  const day = Math.floor(Date.now() / 86400000);
  return list[day % list.length];
}

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, { error: "Method not allowed" }, 405);
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return json(res, { error: "Unauthorized" }, 401);
  }
  try {
    configureWebPush();
    const redis = getRedis();
    const records = await redis.hgetall(SUBSCRIPTIONS_KEY) || {};
    let sent = 0;
    let removed = 0;
    for (const [endpoint, stored] of Object.entries(records)) {
      const record = typeof stored === "string" ? JSON.parse(stored) : stored;
      const language = record.language || "en";
      const payload = JSON.stringify({
        title: "Should I Work Out Today?",
        body: dailyMessage(language),
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
        } else console.error("Push delivery failed", error);
      }
    }
    return json(res, { sent, removed });
  } catch (error) {
    console.error("Daily push failed", error);
    return json(res, { error: "Could not send notifications" }, 500);
  }
}
