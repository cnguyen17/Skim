// Cloudflare Worker — refresh-gallery
// A tiny scheduled "alarm clock": on its Cron Trigger it POSTs the Cloudflare
// Pages deploy hook, which kicks off a rebuild. The build runs
// scripts/sync-gallery.mjs, which pulls the latest photos from Google Drive.
//
// Result: skim drops photos in Drive → within the cron window the site rebuilds
// and shows them. No servers, no databases; well within the Workers free tier
// (100k requests/day — this fires a handful of times per day).
//
// The deploy-hook URL is stored as a secret (DEPLOY_HOOK_URL), never in code.
// Set it with:  wrangler secret put DEPLOY_HOOK_URL
//
// You can also trigger a rebuild on demand:
//   - POST to this Worker's URL (any auth-free ping runs the same refresh), or
//   - POST the deploy hook directly, or
//   - use "Retry deployment" in the Cloudflare Pages dashboard.

async function refresh(env) {
  if (!env.DEPLOY_HOOK_URL) {
    return new Response("DEPLOY_HOOK_URL secret not set", { status: 500 });
  }
  const res = await fetch(env.DEPLOY_HOOK_URL, { method: "POST" });
  return new Response(
    `Triggered Pages rebuild — deploy hook responded ${res.status}`,
    { status: res.ok ? 200 : 502 },
  );
}

export default {
  // Scheduled (cron) trigger.
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(refresh(env));
  },
  // Manual trigger: hit the Worker URL to publish now.
  async fetch(_request, env) {
    return refresh(env);
  },
};
