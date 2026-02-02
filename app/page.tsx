import { redirect } from "next/navigation";
import { getOnboardingProgress } from "@/lib/db/queries";
import { getSessionUserId } from "@/lib/session";

/**
 * Root route - auto-detects user state and redirects appropriately
 * - No session or no progress -> Landing page
 * - Onboarding in progress -> Onboarding page
 * - Onboarding completed -> App overview page
 */
export default async function Home() {
  const userId = await getSessionUserId();
  
  // No session yet - show landing page (session created when onboarding starts)
  if (!userId) {
    redirect("/landing");
  }

  const progress = await getOnboardingProgress(userId);

  if (!progress) {
    // Has session but no progress - show landing page
    redirect("/landing");
  }

  if (!progress.isCompleted) {
    // Onboarding started but not finished - continue onboarding
    redirect("/onboarding");
  }

  // Onboarding completed - show app
  redirect("/overview");
}
