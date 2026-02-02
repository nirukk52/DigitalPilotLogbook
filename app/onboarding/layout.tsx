/**
 * Layout for onboarding route - forces dynamic rendering
 * This page depends on session cookies for user identification
 */

// Force dynamic rendering since onboarding depends on session cookies
export const dynamic = "force-dynamic";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
