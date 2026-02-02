"use client";

interface OnboardingStep2Props {
  onContinue: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

/**
 * WIP placeholder for onboarding step 2
 * Will contain aircraft type selection or additional settings
 */
export function OnboardingStep2({
  onContinue,
  onBack,
  currentStep,
  totalSteps,
}: OnboardingStep2Props) {
  return (
    <div className="w-full max-w-md mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-white">Step 2</h1>
        <p className="text-slate-400 text-base">
          This step is under construction.
        </p>
      </div>

      {/* WIP Card */}
      <div className="p-8 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-[#2a2a2a] rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white">Work in Progress</h2>
        <p className="text-slate-400">
          Aircraft configuration and additional settings will be added here.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white font-semibold py-4 rounded-full transition-colors flex items-center justify-center gap-2"
        >
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
              d="M7 16l-4-4m0 0l4-4m-4 4h18"
            />
          </svg>
          Back
        </button>
        <button
          onClick={onContinue}
          className="flex-1 bg-[#e4b5ff] hover:bg-[#d9a3f5] text-black font-semibold py-4 rounded-full transition-colors flex items-center justify-center gap-2"
        >
          Continue
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
      </div>

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
  );
}
