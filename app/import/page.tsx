"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileUploader } from "./components/FileUploader";
import { parseExcelFile } from "@/lib/import/excel-parser";
import { validateFlights } from "@/lib/import/validator";
import { calculatePortfolioStats, determineLogbookOwner } from "@/lib/export/portfolio-generator";
import type { ImportJob, ParsedFlight, ValidationResult, PDFExportJob } from "@/lib/import/types";

/**
 * Import page - Excel to PDF conversion wizard
 * Handles file upload, preview, validation, and PDF generation
 */
export default function ImportPage() {
  const router = useRouter();
  const [importJob, setImportJob] = useState<ImportJob | null>(null);
  const [pdfExport, setPdfExport] = useState<PDFExportJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setImportJob(null);
    setPdfExport(null);

    try {
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Parse Excel file
      const flights = parseExcelFile(arrayBuffer);
      
      if (flights.length === 0) {
        throw new Error("No flight data found in file");
      }
      
      // Validate flights
      const validation = validateFlights(flights);
      
      // Create import job
      const job: ImportJob = {
        id: crypto.randomUUID(),
        status: "ready",
        fileName: file.name,
        fileSize: file.size,
        flights,
        totalRows: flights.length,
        validation,
        startedAt: new Date(),
        completedAt: new Date(),
      };
      
      setImportJob(job);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse file";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGeneratePdf = useCallback(async () => {
    if (!importJob) return;
    
    setPdfExport({
      id: crypto.randomUUID(),
      status: "generating",
      totalPages: Math.ceil(importJob.flights.length / 18),
      currentPage: 0,
      progressPercent: 0,
      downloadUrl: null,
      fileName: `Logbook_${new Date().toISOString().split("T")[0]}.pdf`,
      error: null,
    });

    try {
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flights: importJob.flights }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      setPdfExport((prev) => prev ? {
        ...prev,
        status: "complete",
        progressPercent: 100,
        downloadUrl: url,
      } : null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "PDF generation failed";
      setPdfExport((prev) => prev ? {
        ...prev,
        status: "error",
        error: message,
      } : null);
    }
  }, [importJob]);

  const handleDownload = useCallback(() => {
    if (!pdfExport?.downloadUrl) return;
    
    const link = document.createElement("a");
    link.href = pdfExport.downloadUrl;
    link.download = pdfExport.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfExport]);

  const handleReset = useCallback(() => {
    if (pdfExport?.downloadUrl) {
      URL.revokeObjectURL(pdfExport.downloadUrl);
    }
    setImportJob(null);
    setPdfExport(null);
    setError(null);
    setSaveResult(null);
  }, [pdfExport]);

  const handleSaveToLogbook = useCallback(async () => {
    if (!importJob) return;

    setIsSaving(true);
    setSaveResult(null);

    try {
      const response = await fetch("/api/flights/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flights: importJob.flights }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save flights");
      }

      setSaveResult({
        success: true,
        message: data.message,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save flights";
      setSaveResult({
        success: false,
        message,
      });
    } finally {
      setIsSaving(false);
    }
  }, [importJob]);

  const handleViewPortfolio = useCallback(() => {
    if (!importJob) return;
    
    // Calculate portfolio stats from flight data
    const stats = calculatePortfolioStats(importJob.flights);
    // Determine the logbook owner by analyzing flight patterns
    const pilotName = determineLogbookOwner(importJob.flights);
    
    // Store in sessionStorage for the portfolio page
    // Convert Map to array for JSON serialization
    const statsForStorage = {
      ...stats,
      aircraftTypes: Array.from(stats.aircraftTypes.entries()),
    };
    
    sessionStorage.setItem("portfolioData", JSON.stringify({
      stats: statsForStorage,
      pilotName,
    }));
    
    // Navigate to portfolio page
    router.push("/portfolio");
  }, [importJob, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23]">
      {/* Header */}
      <header className="h-14 border-b border-white/5 flex items-center px-6">
        <Link
          href="/home"
          className="text-white/60 hover:text-white/80 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
        <h1 className="text-white text-lg font-medium ml-4">Import Logbook</h1>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <StepIndicator
            step={1}
            label="Upload"
            active={!importJob}
            complete={!!importJob}
          />
          <div className="w-12 h-px bg-white/20" />
          <StepIndicator
            step={2}
            label="Preview"
            active={!!importJob && !pdfExport}
            complete={pdfExport?.status === "complete"}
          />
          <div className="w-12 h-px bg-white/20" />
          <StepIndicator
            step={3}
            label="Download"
            active={pdfExport?.status === "complete"}
            complete={false}
          />
        </div>

        {/* Upload Step */}
        {!importJob && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-white mb-2">
                Upload Your Excel Logbook
              </h2>
              <p className="text-white/60">
                Import your TCCA Excel logbook to generate a PDF
              </p>
            </div>
            
            <FileUploader
              onFileSelect={handleFileSelect}
              isLoading={isLoading}
              error={error}
            />
          </div>
        )}

        {/* Preview Step */}
        {importJob && !pdfExport?.downloadUrl && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-white mb-2">
                Review Your Data
              </h2>
              <p className="text-white/60">
                {importJob.totalRows} flights imported from {importJob.fileName}
              </p>
            </div>

            {/* Validation Summary */}
            <ValidationSummary validation={importJob.validation} />

            {/* Flight Preview */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-white font-medium mb-4">Flight Preview</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/60 text-left">
                      <th className="pb-2 pr-4">Date</th>
                      <th className="pb-2 pr-4">Aircraft</th>
                      <th className="pb-2 pr-4">Reg</th>
                      <th className="pb-2 pr-4">Route</th>
                      <th className="pb-2 pr-4 text-right">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/80">
                    {importJob.flights.slice(0, 10).map((flight, i) => (
                      <tr key={i} className="border-t border-white/5">
                        <td className="py-2 pr-4">
                          {flight.flightDate.toLocaleDateString()}
                        </td>
                        <td className="py-2 pr-4">{flight.aircraftMakeModel}</td>
                        <td className="py-2 pr-4">{flight.registration}</td>
                        <td className="py-2 pr-4">
                          {flight.departureAirport} → {flight.arrivalAirport}
                        </td>
                        <td className="py-2 pr-4 text-right">
                          {flight.flightHours.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importJob.flights.length > 10 && (
                  <p className="text-white/40 text-sm mt-2 text-center">
                    ... and {importJob.flights.length - 10} more flights
                  </p>
                )}
              </div>
            </div>

            {/* Save Result Message */}
            {saveResult && (
              <div
                className={`
                  p-4 rounded-xl border
                  ${saveResult.success 
                    ? "bg-green-500/10 border-green-500/30" 
                    : "bg-red-500/10 border-red-500/30"}
                `}
              >
                <div className="flex items-center gap-3">
                  {saveResult.success ? (
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <p className={saveResult.success ? "text-green-400" : "text-red-400"}>
                    {saveResult.message}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={handleReset}
                className="px-6 py-2 text-white/60 hover:text-white/80 transition-colors"
              >
                Upload Different File
              </button>
              <button
                onClick={handleSaveToLogbook}
                disabled={isSaving || saveResult?.success}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : saveResult?.success ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save to Logbook
                  </>
                )}
              </button>
              <button
                onClick={handleViewPortfolio}
                className="px-6 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors border border-white/20 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Pilot Portfolio
              </button>
              <button
                onClick={handleGeneratePdf}
                disabled={pdfExport?.status === "generating"}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {pdfExport?.status === "generating" ? "Generating..." : "Generate PDF"}
              </button>
            </div>

            {/* Generation Progress */}
            {pdfExport?.status === "generating" && (
              <div className="mt-4">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 transition-all duration-300"
                    style={{ width: `${pdfExport.progressPercent}%` }}
                  />
                </div>
                <p className="text-white/60 text-sm text-center mt-2">
                  Generating PDF...
                </p>
              </div>
            )}

            {pdfExport?.status === "error" && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                <p className="text-red-400">{pdfExport.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Download Step */}
        {pdfExport?.status === "complete" && pdfExport.downloadUrl && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">
                PDF Ready!
              </h2>
              <p className="text-white/60">
                Your TCCA logbook PDF has been generated
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 inline-block">
              <p className="text-white/60 text-sm mb-2">File</p>
              <p className="text-white font-medium">{pdfExport.fileName}</p>
              <p className="text-white/40 text-sm mt-1">
                {importJob?.totalRows} flights • {pdfExport.totalPages} pages
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-2 text-white/60 hover:text-white/80 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={handleDownload}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Step indicator component
 */
function StepIndicator({
  step,
  label,
  active,
  complete,
}: {
  step: number;
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
          ${complete ? "bg-green-500 text-white" : ""}
          ${active && !complete ? "bg-purple-600 text-white" : ""}
          ${!active && !complete ? "bg-white/10 text-white/40" : ""}
        `}
      >
        {complete ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          step
        )}
      </div>
      <span className={`text-xs ${active || complete ? "text-white" : "text-white/40"}`}>
        {label}
      </span>
    </div>
  );
}

/**
 * Validation summary component
 */
function ValidationSummary({ validation }: { validation: ValidationResult }) {
  const { totalFlights, successCount, warningCount, errorCount, isValid } = validation;
  
  return (
    <div
      className={`
        p-4 rounded-xl border
        ${isValid ? "bg-green-500/10 border-green-500/30" : "bg-yellow-500/10 border-yellow-500/30"}
      `}
    >
      <div className="flex items-center gap-3">
        {isValid ? (
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
        <div>
          <p className={`font-medium ${isValid ? "text-green-400" : "text-yellow-400"}`}>
            {isValid ? "All flights validated successfully" : "Some flights have issues"}
          </p>
          <p className="text-white/60 text-sm">
            {successCount} valid • {warningCount} warnings • {errorCount} errors
          </p>
        </div>
      </div>
    </div>
  );
}
