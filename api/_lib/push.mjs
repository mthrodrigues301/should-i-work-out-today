import { Redis } from "@upstash/redis";
import webpush from "web-push";

export const SUBSCRIPTIONS_KEY = "workout:push-subscriptions";

export function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("Push storage is not configured");
  return new Redis({ url, token });
}

export function configureWebPush() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) throw new Error("VAPID is not configured");
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export function json(res, response, status = 200) {
  res.setHeader("cache-control", "no-store");
  return res.status(status).json(response);
}
