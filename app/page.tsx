import { redirect } from "next/navigation";
import { getOnboardingProgress } from "@/lib/db/queries";
import { getSessionUserId } from "@/lib/session";

/**
 * Root route - auto-detects user state and redirects appropriately
 * Session is guaranteed to exist (created by proxy/middleware)
 * - No progress -> Landing page
 * - Onboarding in progress -> Onboarding page
 * - Onboarding completed -> App overview page
 */
export default async function Home() {
  const userId = await getSessionUserId();

  // Session should always exist thanks to proxy
  // but handle edge case gracefully
  if (!userId) {
    redirect("/landing");
  }

  try {
    const progress = await getOnboardingProgress(userId);

    if (!progress) {
      // New user - show landing page
      redirect("/landing");
    }

    if (!progress.isCompleted) {
      // Onboarding started but not finished - continue onboarding
      redirect("/onboarding");
    }

    // Onboarding completed - show app
    redirect("/overview");
  } catch (error) {
    // Database error - show landing page as fallback
    console.error("Failed to get onboarding progress:", error);
    redirect("/landing");
  }
}
