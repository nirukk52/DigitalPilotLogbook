"use client";

import { useState, useEffect } from "react";
import type { Licence } from "@/lib/db/schema";

/**
 * Licence types available in the system
 * Based on EASA/FAA/ICAO standards
 */
const LICENCE_TYPES = [
  { value: "CLASS_RATING", label: "Class Rating" },
  { value: "FLIGHT_CREW_LICENCE", label: "Flight Crew Licence" },
  { value: "MEDICAL", label: "Medical" },
  { value: "RADIO", label: "Radio" },
  { value: "TYPE_RATING", label: "Type Rating" },
  { value: "INSTRUCTOR_RATING", label: "Instructor Rating" },
  { value: "INSTRUMENT_RATING", label: "Instrument Rating" },
] as const;

/**
 * Aviation authorities
 */
const AUTHORITIES = [
  { value: "EASA", label: "EASA" },
  { value: "FAA", label: "FAA" },
  { value: "ICAO", label: "ICAO" },
  { value: "CAA_UK", label: "CAA UK" },
  { value: "CASA_AU", label: "CASA" },
] as const;

/**
 * Common licence categories by type
 */
const LICENCE_CATEGORIES: Record<string, string[]> = {
  CLASS_RATING: ["SEP LAND", "SEP SEA", "MEP LAND", "MEP SEA"],
  FLIGHT_CREW_LICENCE: ["PPL A", "CPL A", "ATPL A", "PPL H", "CPL H"],
  MEDICAL: ["CLASS 1", "CLASS 2", "CLASS 3"],
  RADIO: ["FRTOL", "GMDSS"],
  TYPE_RATING: ["A320", "B737", "B777"],
  INSTRUCTOR_RATING: ["FI(A)", "FI(H)", "TRI", "SFI"],
  INSTRUMENT_RATING: ["IR(A)", "IR(H)"],
};

export interface LicenceFormData {
  licenceType: string;
  licenceCategory: string;
  authority: string;
  licenceNumber: string;
  dateOfIssue: string;
  validUntil: string;
  totalHours: string;
  totalLandings: string;
  picHours: string;
  instructorHours: string;
  recencyMonths: string;
  recencyStartDate: string;
  recencyEndDate: string;
}

interface OnboardingStep3Props {
  licences: Licence[];
  onContinue: () => void;
  onBack: () => void;
  onAddLicence: (licence: LicenceFormData) => Promise<void>;
  onDeleteLicence: (licenceId: number) => Promise<void>;
  currentStep: number;
  totalSteps: number;
}

/**
 * Onboarding step 3 - Stay Current & Compliant
 * Allows users to add their licences and ratings to track validity
 */
export function OnboardingStep3({
  licences,
  onContinue,
  onBack,
  onAddLicence,
  onDeleteLicence,
  currentStep,
  totalSteps,
}: OnboardingStep3Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<LicenceFormData>({
    licenceType: "CLASS_RATING",
    licenceCategory: "SEP LAND",
    authority: "EASA",
    licenceNumber: "",
    dateOfIssue: "",
    validUntil: "",
    totalHours: "",
    totalLandings: "",
    picHours: "",
    instructorHours: "",
    recencyMonths: "",
    recencyStartDate: "",
    recencyEndDate: "",
  });

  const handleAddLicence = async () => {
    setIsSubmitting(true);
    try {
      await onAddLicence(formData);
      setShowAddModal(false);
      // Reset form
      setFormData({
        licenceType: "CLASS_RATING",
        licenceCategory: "SEP LAND",
        authority: "EASA",
        licenceNumber: "",
        dateOfIssue: "",
        validUntil: "",
        totalHours: "",
        totalLandings: "",
        picHours: "",
        instructorHours: "",
        recencyMonths: "",
        recencyStartDate: "",
        recencyEndDate: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  };

  const isValidUntilExpiringSoon = (validUntil: Date | null) => {
    if (!validUntil) return false;
    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return new Date(validUntil) < threeMonthsFromNow && new Date(validUntil) > now;
  };

  const isExpired = (validUntil: Date | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  return (
    <>
      <div className="w-full max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-white italic">
            Stay Current & Compliant
          </h1>
          <p className="text-slate-400 text-base">
            Add your licences and ratings to track validity, flight time limits, and recency across authorities.
          </p>
        </div>

        {/* Licences List */}
        <div className="space-y-3">
          {licences.map((licence) => (
            <div
              key={licence.id}
              className="bg-[#2a2a2a] rounded-2xl p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm text-slate-400 uppercase tracking-wide">
                      {licence.licenceType.replace(/_/g, " ")}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {licence.authority}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {licence.licenceCategory}
                  </h2>
                </div>
                <button
                  onClick={() => onDeleteLicence(licence.id)}
                  className="text-slate-500 hover:text-red-500 transition-colors ml-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Dates */}
              <div className="flex justify-between text-sm">
                <div>
                  <div className="text-slate-500">Date of issue</div>
                  <div className="text-white">{formatDate(licence.dateOfIssue)}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500">Valid until</div>
                  <div className={`font-medium ${
                    isExpired(licence.validUntil) 
                      ? "text-red-500" 
                      : isValidUntilExpiringSoon(licence.validUntil)
                      ? "text-yellow-500"
                      : "text-white"
                  }`}>
                    {formatDate(licence.validUntil)}
                  </div>
                </div>
              </div>

              {/* Requirements */}
              {(licence.totalHours || licence.totalLandings || licence.picHours || licence.instructorHours) && (
                <div className="space-y-2 pt-2 border-t border-[#3a3a3a]">
                  {licence.totalHours && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-slate-300">{formatTime(licence.totalHours)} hours</span>
                    </div>
                  )}
                  {licence.totalLandings && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-slate-300">{licence.totalLandings} landings</span>
                    </div>
                  )}
                  {licence.picHours && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-slate-300">{formatTime(licence.picHours)} hours as PIC</span>
                    </div>
                  )}
                  {licence.instructorHours && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-slate-300">{formatTime(licence.instructorHours)} hours with FI</span>
                    </div>
                  )}
                </div>
              )}

              {/* Recency */}
              {licence.recencyMonths && (
                <div className="text-xs text-slate-500 pt-2 border-t border-[#3a3a3a]">
                  In last {licence.recencyMonths} months of validity required ({licence.recencyMonths})
                  <br />
                  {formatDate(licence.recencyStartDate)} &lt;-&gt; {formatDate(licence.recencyEndDate)}
                </div>
              )}

              {/* Licence Number */}
              {licence.licenceNumber && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{licence.licenceNumber}</span>
                </div>
              )}
            </div>
          ))}

          {/* Add Licence Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full border-2 border-dashed border-[#3a3a3a] hover:border-[#9333ea] rounded-2xl p-6 transition-colors flex flex-col items-center justify-center gap-2"
          >
            <div className="w-12 h-12 rounded-full bg-[#9333ea] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-white font-medium">Add Licence</span>
          </button>
        </div>

        {/* Navigation Buttons */}
        <div className="space-y-3">
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

          <button
            onClick={onBack}
            className="w-full text-slate-400 hover:text-white py-2 transition-colors"
          >
            Back
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

      {/* Add Licence Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-[#1a1a1a] rounded-3xl p-6 space-y-6 my-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add Licence</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Licence Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Licence Type
                </label>
                <select
                  value={formData.licenceType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setFormData({
                      ...formData,
                      licenceType: newType,
                      licenceCategory: LICENCE_CATEGORIES[newType]?.[0] || "",
                    });
                  }}
                  className="w-full bg-[#2a2a2a] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#9333ea]"
                >
                  {LICENCE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Licence Category */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.licenceCategory}
                  onChange={(e) => setFormData({ ...formData, licenceCategory: e.target.value })}
                  className="w-full bg-[#2a2a2a] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#9333ea]"
                >
                  {LICENCE_CATEGORIES[formData.licenceType]?.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Authority */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Authority
                </label>
                <select
                  value={formData.authority}
                  onChange={(e) => setFormData({ ...formData, authority: e.target.value })}
                  className="w-full bg-[#2a2a2a] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#9333ea]"
                >
                  {AUTHORITIES.map((auth) => (
                    <option key={auth.value} value={auth.value}>
                      {auth.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Licence Number */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Licence Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.licenceNumber}
                  onChange={(e) => setFormData({ ...formData, licenceNumber: e.target.value })}
                  placeholder="e.g., D:FCL.PPL(A)112233"
                  className="w-full bg-[#2a2a2a] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#9333ea]"
                />
              </div>

              {/* Date of Issue */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Date of Issue (Optional)
                </label>
                <input
                  type="date"
                  value={formData.dateOfIssue}
                  onChange={(e) => setFormData({ ...formData, dateOfIssue: e.target.value })}
                  className="w-full bg-[#2a2a2a] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#9333ea]"
                />
              </div>

              {/* Valid Until */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Valid Until (Optional)
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full bg-[#2a2a2a] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#9333ea]"
                />
              </div>

              {/* Total Hours */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Total Hours (Optional, format: HH:MM)
                </label>
                <input
                  type="text"
                  value={formData.totalHours}
                  onChange={(e) => setFormData({ ...formData, totalHours: e.target.value })}
                  placeholder="e.g., 12:00"
                  className="w-full bg-[#2a2a2a] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#9333ea]"
                />
              </div>

              {/* Total Landings */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Total Landings (Optional)
                </label>
                <input
                  type="number"
                  value={formData.totalLandings}
                  onChange={(e) => setFormData({ ...formData, totalLandings: e.target.value })}
                  placeholder="e.g., 12"
                  className="w-full bg-[#2a2a2a] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#9333ea]"
                />
              </div>

              {/* PIC Hours */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  PIC Hours (Optional, format: HH:MM)
                </label>
                <input
                  type="text"
                  value={formData.picHours}
                  onChange={(e) => setFormData({ ...formData, picHours: e.target.value })}
                  placeholder="e.g., 14:26"
                  className="w-full bg-[#2a2a2a] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#9333ea]"
                />
              </div>

              {/* Instructor Hours */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Instructor Hours (Optional, format: HH:MM)
                </label>
                <input
                  type="text"
                  value={formData.instructorHours}
                  onChange={(e) => setFormData({ ...formData, instructorHours: e.target.value })}
                  placeholder="e.g., 1:25"
                  className="w-full bg-[#2a2a2a] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#9333ea]"
                />
              </div>

              {/* Recency Months */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Recency Months (Optional)
                </label>
                <input
                  type="number"
                  value={formData.recencyMonths}
                  onChange={(e) => setFormData({ ...formData, recencyMonths: e.target.value })}
                  placeholder="e.g., 12"
                  className="w-full bg-[#2a2a2a] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#9333ea]"
                />
              </div>

              {/* Recency Start Date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Recency Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.recencyStartDate}
                  onChange={(e) => setFormData({ ...formData, recencyStartDate: e.target.value })}
                  className="w-full bg-[#2a2a2a] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#9333ea]"
                />
              </div>

              {/* Recency End Date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Recency End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.recencyEndDate}
                  onChange={(e) => setFormData({ ...formData, recencyEndDate: e.target.value })}
                  className="w-full bg-[#2a2a2a] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#9333ea]"
                />
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddLicence}
              disabled={isSubmitting}
              className="w-full bg-[#9333ea] hover:bg-[#7c2bc7] text-white font-semibold py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "Add Licence"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
