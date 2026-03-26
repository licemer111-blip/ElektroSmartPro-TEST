import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendPushNotifications } from '@/lib/web-push';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
      );
    }

    // Get notification payload
    const { title, body, url, tag, requireInteraction } = await request.json();
    
    if (!title || !body) {
      return NextResponse.json(
        { error: 'Tytuł i treść są wymagane' },
        { status: 400 }
      );
    }

    // Get user's subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user.id);

    if (subsError) {
      logger.error('[Push Send] Database error', {}, subsError);
      return NextResponse.json(
        { error: 'Błąd pobierania subskrypcji' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'Brak aktywnych subskrypcji powiadomień' },
        { status: 404 }
      );
    }

    // Convert to PushSubscription format
    const pushSubscriptions = subscriptions.map((sub) => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }));

    // Send notifications
    const result = await sendPushNotifications(pushSubscriptions, {
      title,
      body,
      url,
      tag,
      requireInteraction,
    });

    // Clean up expired/unsubscribed endpoints (410 Gone / 404 Not Found)
    if (result.expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', result.expiredEndpoints);
    }

    return NextResponse.json({
      success: true,
      sent: result.success,
      failed: result.failed,
    });
  } catch (error) {
    logger.error('[Push Send] Error', {}, error);
    return NextResponse.json(
      { error: 'Błąd serwera — spróbuj ponownie' },
      { status: 500 }
    );
  }
}
