export const dynamic = "force-dynamic";
import Header from "@/components/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileBottomNavPadding } from "@/components/layout/mobile-bottom-nav";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { SurveyWidget } from "@/components/feedback/survey-widget";
import { WhatsNewDialog } from "@/components/changelog/whats-new-dialog";
import { AiHelperWidget } from "@/components/ai-helper/ai-helper-widget";
import { FieldModeProvider } from "@/components/project/field-mode-toggle";
import { NotificationProvider } from "@/components/notifications/notification-system";
import { getUser } from "@/app/auth/actions";
import { getUserProfile } from "@/app/dashboard/actions";
import { WelcomeWizard } from "@/components/onboarding/welcome-wizard";
import { RateNotSetBanner } from "@/components/knr/RateNotSetBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const userId = user?.id;
  const profile = userId ? await getUserProfile() : null;
  const hasCompanyName = !!(profile?.company_name);
  const rateNotSet = userId ? (profile?.hourly_rate == null) : false;

  const content = (
    <div className="flex flex-col min-h-screen">
      <Header />
      <RateNotSetBanner rateNotSet={rateNotSet} />
      <main className="flex-1">
        {children}
      </main>
      <MobileBottomNav />
      <MobileBottomNavPadding />
      <OfflineIndicator />
      <SurveyWidget />
      <WhatsNewDialog />
      <AiHelperWidget />
      {userId && (
        <WelcomeWizard userId={userId} hasCompanyName={hasCompanyName} />
      )}
    </div>
  );

  return (
    <FieldModeProvider>
      {userId ? (
        <NotificationProvider userId={userId}>
          {content}
        </NotificationProvider>
      ) : (
        content
      )}
    </FieldModeProvider>
  );
}
