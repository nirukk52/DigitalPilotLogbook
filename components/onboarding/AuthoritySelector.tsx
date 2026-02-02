"use client";

/**
 * Modal component for selecting aviation authority
 * Displays a list of global aviation authorities with their logos and full names
 */
interface AuthoritySelectorProps {
  onSelect: (code: string, name: string) => void;
  onClose: () => void;
  currentAuthority: string;
}

const authorities = [
  { code: "FAA", name: "Federal Aviation Administration - USA", logo: "🇺🇸" },
  { code: "EASA", name: "European Union Aviation Safety Agency", logo: "🇪🇺" },
  { code: "UKCAA", name: "United Kingdom Civil Aviation Authority", logo: "🇬🇧" },
  { code: "TCCA", name: "Transport Canada Civil Aviation - Canada", logo: "🇨🇦" },
  { code: "GCAA", name: "General Civil Aviation Authority - UAE", logo: "🇦🇪" },
  { code: "GACA", name: "General Authority of Civil Aviation - Saudi Arabia", logo: "🇸🇦" },
  { code: "QCAA", name: "Qatar Civil Aviation Authority", logo: "🇶🇦" },
  { code: "HKCAD", name: "Hong Kong Civil Aviation Department", logo: "🇭🇰" },
  { code: "CAAC", name: "Civil Aviation Administration of China", logo: "🇨🇳" },
  { code: "JCAB", name: "Japan Civil Aviation Bureau", logo: "🇯🇵" },
  { code: "CASA", name: "Civil Aviation Safety Authority - Australia", logo: "🇦🇺" },
  { code: "NZCAA", name: "Civil Aviation Authority - New Zealand", logo: "🇳🇿" },
  { code: "SACAA", name: "South African Civil Aviation Authority", logo: "🇿🇦" },
  { code: "DGCA", name: "Directorate General of Civil Aviation - India", logo: "🇮🇳" },
  { code: "CAE", name: "Civil Aviation Authority - Various", logo: "✈️" },
];

export function AuthoritySelector({
  onSelect,
  onClose,
  currentAuthority,
}: AuthoritySelectorProps) {
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#2a2a2a]">
          <h2 className="text-xl font-bold text-white">Select Aviation Authority</h2>
        </div>

        {/* Scrollable List */}
        <div className="overflow-y-auto flex-1 p-4">
          <div className="space-y-2">
            {authorities.map((authority) => (
              <button
                key={authority.code}
                onClick={() => onSelect(authority.code, authority.name)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${
                  currentAuthority === authority.code
                    ? "bg-[#2a2a2a] border border-[#e4b5ff]"
                    : "bg-[#151515] hover:bg-[#202020] border border-transparent"
                }`}
              >
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl">
                  {authority.logo}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-white font-semibold">{authority.code}</div>
                  <div className="text-slate-400 text-sm">{authority.name}</div>
                </div>
                {currentAuthority === authority.code && (
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
