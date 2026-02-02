"use client";

interface OnboardingStep5Props {
  onContinue: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

/**
 * Onboarding step 5 - Stay Updated / Enable Notifications
 * Requests notification permission to receive updates about flights, licences, and subscription
 */
export function OnboardingStep5({
  onContinue,
  onBack,
  currentStep,
  totalSteps,
}: OnboardingStep5Props) {
  const handleAllowNotifications = async () => {
    try {
      // Request notification permission from the browser
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        // Continue regardless of permission result (user can enable later)
        onContinue();
      } else {
        // Notifications not supported, continue anyway
        onContinue();
      }
    } catch {
      // Error requesting permission, continue anyway
      onContinue();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col min-h-[80vh]">
      {/* Header */}
      <div className="text-center space-y-3 pt-8">
        <h1 className="text-3xl font-bold text-white italic">Stay Updated</h1>
        <p className="text-slate-400 text-base px-4">
          Enable notifications to receive important updates about your flights,
          licences, and subscription.
        </p>
      </div>

      {/* Bell Icon - Centered */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          {/* Sound waves on top left */}
          <svg
            className="absolute -top-8 -left-10 w-10 h-10 text-[#2a2a2a]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              d="M8 8C6.5 9.5 6 11.5 6 14"
            />
          </svg>
          <svg
            className="absolute -top-12 -left-6 w-8 h-8 text-[#2a2a2a]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              d="M10 6C8 8 7 10 7 14"
            />
          </svg>
          
          {/* Sound waves on top right */}
          <svg
            className="absolute -top-8 -right-10 w-10 h-10 text-[#2a2a2a]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              d="M16 8C17.5 9.5 18 11.5 18 14"
            />
          </svg>
          <svg
            className="absolute -top-12 -right-6 w-8 h-8 text-[#2a2a2a]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              d="M14 6C16 8 17 10 17 14"
            />
          </svg>

          {/* Bell icon */}
          <svg
            className="w-40 h-40 text-[#2a2a2a]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="space-y-6 pb-8">
        {/* Allow Notifications Button */}
        <button
          onClick={handleAllowNotifications}
          className="w-full bg-[#e4b5ff] hover:bg-[#d9a3f5] text-black font-semibold py-4 rounded-full transition-colors flex items-center justify-center gap-2"
        >
          Allow Notifications
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </button>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="w-full text-slate-400 hover:text-white py-2 transition-colors"
        >
          Back
        </button>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? "bg-white" : "bg-[#2a2a2a]"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
