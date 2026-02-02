"use client";

import Image from "next/image";

interface OnboardingStep6Props {
  onContinue: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

/**
 * Onboarding step 6 - Bring Your History
 * Allows users to import flight data from paper logbook or various digital sources
 * This is informational only - actual import happens after onboarding
 */
export function OnboardingStep6({
  onContinue,
  onBack,
  currentStep,
  totalSteps,
}: OnboardingStep6Props) {
  // Import source options with their display info
  const importSources = [
    {
      id: "paper",
      name: "Totals from Paper Logbook",
      icon: (
        <svg
          className="w-6 h-6 text-gray-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      id: "aims-ecrew",
      name: "AIMS eCrew",
      logo: "/import-logos/aims-ecrew.png",
      logoText: "eCrew",
    },
    {
      id: "logten",
      name: "LogTen Pilot Log",
      logo: "/import-logos/logten.png",
    },
    {
      id: "emirates",
      name: "Emirates",
      logo: "/import-logos/emirates.png",
    },
    {
      id: "lot",
      name: "LOT Polish Airlines",
      logo: "/import-logos/lot.png",
    },
    {
      id: "foreflight",
      name: "ForeFlight",
      logo: "/import-logos/foreflight.png",
      bgGradient: true,
    },
    {
      id: "leon",
      name: "Leon Software",
      logo: "/import-logos/leon.png",
      faded: true,
    },
  ];

  return (
    <div className="w-full max-w-md mx-auto flex flex-col min-h-[80vh]">
      {/* Header */}
      <div className="text-center space-y-3 pt-8">
        <h1 className="text-3xl font-bold text-white italic">
          Bring Your History
        </h1>
        <p className="text-slate-400 text-base px-4">
          If you used the paper logbook before, set your start values in Opening
          Totals. To import your digital data, explore options in the Import
          section.
        </p>
      </div>

      {/* Import Options List */}
      <div className="flex-1 flex flex-col justify-center py-8 space-y-3 px-4">
        {importSources.map((source) => (
          <button
            key={source.id}
            className={`w-full bg-white rounded-full py-3.5 px-6 flex items-center justify-center gap-3 transition-all hover:shadow-lg ${
              source.faded ? "opacity-50" : ""
            } ${source.bgGradient ? "bg-gradient-to-r from-gray-200 to-gray-400" : ""}`}
          >
            {source.icon ? (
              source.icon
            ) : source.logo ? (
              <div className="w-10 h-6 relative flex items-center justify-center">
                {source.logoText ? (
                  <span className="text-blue-600 font-bold text-lg">
                    e<span className="text-gray-800">crew</span>
                  </span>
                ) : (
                  <Image
                    src={source.logo}
                    alt={source.name}
                    width={40}
                    height={24}
                    className="object-contain"
                  />
                )}
              </div>
            ) : null}
            <span className="text-gray-900 font-medium">{source.name}</span>
          </button>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="space-y-6 pb-8 px-4">
        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full bg-[#e4b5ff] hover:bg-[#d9a3f5] text-black font-semibold py-4 rounded-full transition-colors flex items-center justify-center gap-2"
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
