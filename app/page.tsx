import { redirect } from "next/navigation";

/**
 * Root route - simple redirect to landing page
 * This page is statically cached for performance
 * The onboarding page handles redirect to overview if already completed
 */
export default function Home() {
  redirect("/landing");
}
