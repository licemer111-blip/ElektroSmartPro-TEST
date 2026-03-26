import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import webpush from "web-push";

// Initialize Supabase with service role key for server-side access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

// Configure web-push
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    "mailto:support@elektrosmart.pro",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function GET(request: Request) {
  // Verify cron secret (for Vercel cron jobs)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find projects with deadlines in the next 2-3 days
    const { data: upcomingProjects, error: projectsError } = await supabase
      .from("projects")
      .select(`
        id,
        name,
        deadline,
        user_id,
        status,
        profiles!projects_user_id_fkey (
          email,
          full_name
        )
      `)
      .gte("deadline", now.toISOString())
      .lte("deadline", threeDaysFromNow.toISOString())
      .eq("status", "draft") // Only remind for active/draft projects
      .order("deadline", { ascending: true });

    if (projectsError) {
      logger.error("Error fetching projects:", {}, projectsError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!upcomingProjects || upcomingProjects.length === 0) {
      return NextResponse.json({ 
        message: "No upcoming deadlines",
        processed: 0 
      });
    }

    let emailsSent = 0;
    let pushSent = 0;

    for (const project of upcomingProjects) {
      const deadline = new Date(project.deadline);
      const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // profiles comes as array from join, get first element
      const profilesArray = project.profiles as unknown as { email: string | null; full_name: string | null }[] | null;
      const profile = profilesArray?.[0] ?? null;
      
      if (!profile?.email) continue;

      // Format deadline for display
      const deadlineFormatted = deadline.toLocaleDateString("pl-PL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Send email reminder
      try {
        await resend.emails.send({
          from: "ElektroSmart PRO <powiadomienia@elektrosmart.pro>",
          to: profile.email,
          subject: `⏰ Przypomnienie: "${project.name}" - deadline za ${daysUntil} dni`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Przypomnienie o terminie</h1>
              </div>
              <div style="padding: 24px; background: #f8fafc; border-radius: 0 0 8px 8px;">
                <p style="font-size: 16px; color: #334155;">Cześć${profile.full_name ? ` ${profile.full_name}` : ""}!</p>
                
                <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2563eb;">
                  <h2 style="margin: 0 0 8px 0; color: #1e293b;">${project.name}</h2>
                  <p style="margin: 0; color: #64748b;">
                    <strong>Termin realizacji:</strong> ${deadlineFormatted}
                  </p>
                  <p style="margin: 8px 0 0 0; color: ${daysUntil <= 2 ? "#dc2626" : "#f59e0b"}; font-weight: bold;">
                    ${daysUntil === 1 ? "⚠️ Pozostał 1 dzień!" : `⏳ Pozostały ${daysUntil} dni`}
                  </p>
                </div>
                
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/projects/${project.id}" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
                  Otwórz projekt →
                </a>
                
                <p style="margin-top: 24px; font-size: 14px; color: #94a3b8;">
                  To automatyczne przypomnienie z ElektroSmart PRO.
                </p>
              </div>
            </div>
          `,
        });
        emailsSent++;
      } catch (emailError) {
        logger.error(`Error sending email to ${profile.email}:`, {}, emailError);
      }

      // Send push notification
      try {
        const { data: subscriptions } = await supabase
          .from("push_subscriptions")
          .select("subscription")
          .eq("user_id", project.user_id);

        if (subscriptions && subscriptions.length > 0) {
          const payload = JSON.stringify({
            title: `⏰ ${project.name}`,
            body: `Deadline za ${daysUntil} ${daysUntil === 1 ? "dzień" : "dni"}!`,
            icon: "/icon.png",
            url: `/dashboard/projects/${project.id}`,
          });

          for (const sub of subscriptions) {
            try {
              await webpush.sendNotification(sub.subscription, payload);
              pushSent++;
            } catch (pushError: unknown) {
              // Remove invalid subscriptions
              if (typeof pushError === 'object' && pushError !== null && 'statusCode' in pushError && (pushError as { statusCode: number }).statusCode === 410) {
                await supabase
                  .from("push_subscriptions")
                  .delete()
                  .eq("subscription", sub.subscription);
              }
            }
          }
        }
      } catch (pushError) {
        logger.error(`Error sending push for project "${project.name}"`, {}, pushError);
      }
    }

    return NextResponse.json({
      message: "Deadline reminders processed",
      processed: upcomingProjects.length,
      emailsSent,
      pushSent,
    });
  } catch (error) {
    logger.error("Error processing deadline reminders:", {}, error);
    return NextResponse.json({ error: "Błąd serwera — spróbuj ponownie" }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST(request: Request) {
  return GET(request);
}
