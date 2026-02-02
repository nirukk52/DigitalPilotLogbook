import { redirect } from "next/navigation";
import { getOnboardingProgress } from "@/lib/db/queries";
import { getSessionUserId } from "@/lib/session";

// Force dynamic rendering - this page depends on cookies and database state
export const dynamic = "force-dynamic";

/**
 * Root route - auto-detects user state and redirects appropriately
 * Session is guaranteed to exist (created by proxy/middleware)
 * - No progress -> Landing page
 * - Onboarding in progress -> Onboarding page
 * - Onboarding completed -> App overview page
 */
export default async function Home() {
  const userId = await getSessionUserId();

  console.log("[Root] userId from session:", userId);

  // Session should always exist thanks to proxy
  // but handle edge case gracefully
  if (!userId) {
    console.log("[Root] No userId, redirecting to landing");
    redirect("/landing");
  }

  try {
    const progress = await getOnboardingProgress(userId);
    console.log("[Root] Onboarding progress:", progress);

    if (!progress) {
      // New user - show landing page
      console.log("[Root] No progress record, redirecting to landing");
      redirect("/landing");
    }

    if (!progress.isCompleted) {
      // Onboarding started but not finished - continue onboarding
      console.log("[Root] Onboarding not completed, redirecting to onboarding");
      redirect("/onboarding");
    }

    // Onboarding completed - show app
    console.log("[Root] Onboarding completed, redirecting to overview");
    redirect("/overview");
  } catch (error) {
    // Database error - show landing page as fallback
    console.error("[Root] Database error:", error);
    redirect("/landing");
  }
}
