const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
const graphVersion = process.env.INSTAGRAM_GRAPH_API_VERSION || "v25.0";
const graphHost = (process.env.INSTAGRAM_GRAPH_HOST || "https://graph.facebook.com").replace(/\/$/, "");

function respond(res, body, status = 200) {
  res.status(status).json(body);
}

async function get(path, fields, token) {
  const url = new URL(`${graphHost}/${graphVersion}/${path}`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("access_token", token);
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) throw new Error(body?.error?.message || "Meta rejected the connection test");
  return body;
}

// An authenticated diagnostic endpoint for Vercel's manual Run/testing flow.
// It never returns the access token or Meta's raw error payload.
export default async function handler(req, res) {
  if (req.method !== "GET") return respond(res, { error: "Method not allowed" }, 405);
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return respond(res, { error: "Unauthorized" }, 401);
  }
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token || !accountId) return respond(res, { error: "Instagram publishing is not configured" }, 500);

  try {
    const account = await get(accountId, "id,username,account_type,media_count", token);
    let quota = null;
    try {
      quota = await get(`${accountId}/content_publishing_limit`, "config,quota_usage", token);
    } catch {
      // Connection remains valid even if this optional field is unavailable.
    }
    return respond(res, {
      status: "connected",
      account: {
        id: account.id,
        username: account.username,
        accountType: account.account_type,
        mediaCount: account.media_count
      },
      publishingQuota: quota ? { config: quota.config, usage: quota.quota_usage } : null
    });
  } catch (error) {
    console.error("Instagram connection test failed", { message: error.message });
    return respond(res, {
      error: "Instagram connection test failed",
      message: "Check the Facebook Login token, its permissions, the linked Facebook Page and INSTAGRAM_ACCOUNT_ID."
    }, 502);
  }
}
