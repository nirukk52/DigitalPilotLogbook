"use client";

interface OnboardingStep4Props {
  onContinue: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

/**
 * Onboarding step 4 - Enable Location Access
 * Requests location permission for nearby airports, flight tracking, and navigation services
 */
export function OnboardingStep4({
  onContinue,
  onBack,
  currentStep,
  totalSteps,
}: OnboardingStep4Props) {
  const handleAllowLocation = async () => {
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        onContinue();
        return;
      }

      // Use Permissions API if available to check/request permission
      if ("permissions" in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: "geolocation" });
          if (permission.state === "granted" || permission.state === "denied") {
            // Already decided, move on
            onContinue();
            return;
          }
        } catch {
          // Permissions API not fully supported, fall through
        }
      }

      // Request location with a timeout - browser will show permission prompt
      // We continue after a short delay to trigger the prompt but not block navigation
      let continued = false;
      
      const timeoutId = setTimeout(() => {
        if (!continued) {
          continued = true;
          onContinue();
        }
      }, 500);

      navigator.geolocation.getCurrentPosition(
        () => {
          clearTimeout(timeoutId);
          if (!continued) {
            continued = true;
            onContinue();
          }
        },
        () => {
          clearTimeout(timeoutId);
          if (!continued) {
            continued = true;
            onContinue();
          }
        },
        { timeout: 5000 }
      );
    } catch {
      // Error requesting permission, continue anyway
      onContinue();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col min-h-[80vh]">
      {/* Header */}
      <div className="text-center space-y-3 pt-8">
        <h1 className="text-3xl font-bold text-white italic">
          Enable Location Access
        </h1>
        <p className="text-slate-400 text-base px-4">
          FLYLOG.io needs your location to show you nearby airports, track your flights, and provide navigation services.
        </p>
      </div>

      {/* Location Pin Icon - Centered */}
      <div className="flex-1 flex items-center justify-center">
        <svg
          className="w-40 h-40 text-[#2a2a2a]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
      </div>

      {/* Bottom Section */}
      <div className="space-y-6 pb-8">
        {/* Allow Location Button */}
        <button
          onClick={handleAllowLocation}
          className="w-full bg-[#e4b5ff] hover:bg-[#d9a3f5] text-black font-semibold py-4 rounded-full transition-colors flex items-center justify-center gap-2"
        >
          Allow Location Access
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

        {/* Skip/Back Button */}
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
