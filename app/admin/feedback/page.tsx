import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/utils/admin";
import {
  getSurveyStats,
  getAllSurveys,
  getAllFeedback,
} from "@/app/dashboard/feedback/survey-actions";
import { FeedbackDashboard } from "@/components/admin/feedback-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Opinie & Ankiety | Admin | ElektroSmart PRO",
  description: "Przegląd opinii i ankiet od użytkowników",
};

export default async function AdminFeedbackPage() {
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    redirect("/dashboard");
  }

  const [stats, surveys, feedback] = await Promise.all([
    getSurveyStats(),
    getAllSurveys(),
    getAllFeedback(),
  ]);

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <FeedbackDashboard stats={stats} surveys={surveys} feedback={feedback} />
    </main>
  );
}
