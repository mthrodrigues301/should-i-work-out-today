import { json } from "../_lib/push.mjs";

export default function handler(req, res) {
  if (req.method !== "GET") return json(res, { error: "Method not allowed" }, 405);
  if (!process.env.VAPID_PUBLIC_KEY) return json(res, { error: "Notifications are not configured" }, 503);
  return json(res, { publicKey: process.env.VAPID_PUBLIC_KEY });
}
