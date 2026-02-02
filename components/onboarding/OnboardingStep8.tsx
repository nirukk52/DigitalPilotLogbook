"use client";

interface OnboardingStep8Props {
  onContinue: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

/**
 * Aviation authority data for displaying approved logos
 * Represents the authorities whose formats are supported for PDF exports
 */
const authorities = [
  { code: "FAA", name: "Federal Aviation Administration", country: "USA" },
  { code: "EASA", name: "European Union Aviation Safety Agency", country: "EU" },
  { code: "UK_CAA", name: "UK Civil Aviation Authority", country: "UK" },
  { code: "TCCA", name: "Transport Canada Civil Aviation", country: "Canada" },
  { code: "CAAV", name: "Civil Aviation Authority Vietnam", country: "Vietnam" },
  { code: "CASA", name: "Civil Aviation Safety Authority", country: "Australia" },
  { code: "GCAA", name: "General Civil Aviation Authority", country: "UAE" },
  { code: "KCAA", name: "Kenya Civil Aviation Authority", country: "Kenya" },
  { code: "DGCA", name: "Directorate General of Civil Aviation", country: "India" },
  { code: "CAAC", name: "Civil Aviation Administration of China", country: "China" },
  { code: "DGAC", name: "Direction Générale de l'Aviation Civile", country: "France" },
  { code: "AESA", name: "Agencia Estatal de Seguridad Aérea", country: "Spain" },
];

/**
 * Onboarding step 8 - Approved by Authorities
 * Informational screen showing aviation authorities that approve PDF exports
 * Static display - no user input required
 */
export function OnboardingStep8({
  onContinue,
  onBack,
  currentStep,
  totalSteps,
}: OnboardingStep8Props) {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col min-h-[80vh]">
      {/* Header */}
      <div className="text-center space-y-3 pt-8">
        <h1 className="text-3xl font-bold text-white italic">
          Approved by Authorities
        </h1>
        <p className="text-slate-400 text-base px-4">
          Generate PDF exports approved and accepted by major authorities, with
          your signature included.
        </p>
      </div>

      {/* Authorities Grid */}
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="grid grid-cols-3 gap-4 px-4">
          {authorities.map((authority) => (
            <div
              key={authority.code}
              className="bg-white rounded-xl p-3 aspect-square flex items-center justify-center shadow-sm"
            >
              <div className="text-center">
                <div className="text-xs font-bold text-gray-800 leading-tight">
                  {authority.code}
                </div>
                <div className="text-[8px] text-gray-500 mt-0.5 leading-tight">
                  {authority.country}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="space-y-6 pb-8">
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
