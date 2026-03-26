// Web Push Notifications API
// Handles sending push notifications via web-push library

import { logger } from "@/lib/logger";
import webpush from 'web-push';

// VAPID keys (these should be in .env)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = 'mailto:elektrosmartpro@gmail.com';

// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

/**
 * Send push notification to a subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    logger.error('[Web Push] VAPID keys not configured');
    throw new Error('Web Push not configured');
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  };

  const notificationPayload = {
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icon.png',
    badge: payload.badge || '/icon.png',
    tag: payload.tag || 'notification',
    url: payload.url || '/dashboard',
    requireInteraction: payload.requireInteraction || false,
    actions: payload.actions || [
      { action: 'open', title: 'Otwórz' },
      { action: 'close', title: 'Zamknij' },
    ],
  };

  try {
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(notificationPayload)
    );
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    logger.error('[Web Push] Send failed', { endpoint: subscription.endpoint, statusCode }, error);
    throw error;
  }
}

/**
 * Send notification to multiple subscriptions
 */
export async function sendPushNotifications(
  subscriptions: PushSubscription[],
  payload: NotificationPayload
): Promise<{ success: number; failed: number; expiredEndpoints: string[] }> {
  let success = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await sendPushNotification(subscription, payload);
        success++;
      } catch (error: unknown) {
        failed++;
        // 410 Gone = subscription expired/unsubscribed, 404 Not Found = never existed
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          expiredEndpoints.push(subscription.endpoint);
        }
      }
    })
  );

  return { success, failed, expiredEndpoints };
}

/**
 * Generate VAPID keys (run once to generate keys for .env)
 */
export function generateVAPIDKeys() {
  return webpush.generateVAPIDKeys();
}
