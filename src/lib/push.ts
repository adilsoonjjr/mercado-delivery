import webpush from "web-push";
import { prisma } from "./prisma";

// Lazy init — evita crash durante o build quando as env vars não existem
function getWebPush() {
  webpush.setVapidDetails(
    process.env.VAPID_MAILTO!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  return webpush;
}

export async function sendPushToMarket(
  marketId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  const subs = await prisma.pushSubscription.findMany({ where: { marketId } });
  if (!subs.length) return { sent: 0 };

  const wp = getWebPush();
  const results = await Promise.allSettled(
    subs.map((sub) =>
      wp.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  );

  // Remove expired/invalid subscriptions
  const failed = results
    .map((r, i) => (r.status === "rejected" ? subs[i].endpoint : null))
    .filter(Boolean) as string[];

  if (failed.length) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: failed } } });
  }

  return { sent: results.filter((r) => r.status === "fulfilled").length };
}

export async function sendPushToUser(
  userId: string,
  marketId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId, marketId } });
  if (!subs.length) return { sent: 0 };

  const wp = getWebPush();
  const results = await Promise.allSettled(
    subs.map((sub) =>
      wp.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  );

  const failed = results
    .map((r, i) => (r.status === "rejected" ? subs[i].endpoint : null))
    .filter(Boolean) as string[];

  if (failed.length) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: failed } } });
  }

  return { sent: results.filter((r) => r.status === "fulfilled").length };
}
