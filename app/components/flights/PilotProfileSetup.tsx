"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * PilotProfileSetup - One-time setup modal for new users
 * Captures essential profile data before first flight entry
 * Shown when user has no flights and no profile configured
 * Also used for editing existing profile - fetches saved data on mount
 */

interface PilotProfileSetupProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function PilotProfileSetup({ onComplete, onSkip }: PilotProfileSetupProps) {
  const [pilotName, setPilotName] = useState('');
  const [homeBase, setHomeBase] = useState('');
  const [defaultInstructor, setDefaultInstructor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setPilotName(data.profile.pilotName || '');
            setHomeBase(data.profile.homeBase || '');
            setDefaultInstructor(data.profile.defaultInstructor || '');
          }
        }
      } catch {
        // Silent fail - start with empty fields
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!pilotName.trim()) {
        throw new Error('Pilot name is required');
      }
      if (!homeBase.trim()) {
        throw new Error('Home base is required');
      }

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pilotName: pilotName.trim(),
          homeBase: homeBase.trim().toUpperCase(),
          defaultInstructor: defaultInstructor.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  }, [pilotName, homeBase, defaultInstructor, onComplete]);

  // Show loading state while fetching existing profile
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{pilotName ? 'Edit your profile' : 'Welcome! Let\'s set up your profile'}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          This information helps pre-fill your flight entries.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Pilot Name */}
        <div>
          <label className="block text-gray-600 dark:text-gray-400 text-sm mb-1">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={pilotName}
            onChange={(e) => setPilotName(e.target.value)}
            placeholder="John Smith"
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec]"
            required
          />
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Used as PIC name when you fly as Pilot in Command
          </p>
        </div>

        {/* Home Base */}
        <div>
          <label className="block text-gray-600 dark:text-gray-400 text-sm mb-1">
            Home Base (ICAO) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={homeBase}
            onChange={(e) => setHomeBase(e.target.value.toUpperCase())}
            placeholder="CZBB"
            maxLength={4}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec]"
            required
          />
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Your primary airport - used as default departure
          </p>
        </div>

        {/* Default Instructor */}
        <div>
          <label className="block text-gray-600 dark:text-gray-400 text-sm mb-1">
            Default Instructor (optional)
          </label>
          <input
            type="text"
            value={defaultInstructor}
            onChange={(e) => setDefaultInstructor(e.target.value)}
            placeholder="Jane Doe"
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec]"
          />
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Auto-filled as PIC when you fly as Student
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm transition-colors"
          >
            Skip for now
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-[#137fec] hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
