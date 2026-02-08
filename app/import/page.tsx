"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileUploader } from "./components/FileUploader";
import { ExcelLogbookDashboard } from "./components/ExcelLogbookDashboard";
import { parseExcelFile } from "@/lib/import/excel-parser";
import { validateFlights } from "@/lib/import/validator";
import { calculatePortfolioStats, determineLogbookOwner } from "@/lib/export/portfolio-generator";
import type { ImportJob, ParsedFlight, ValidationResult, ValidationIssue, PDFExportJob } from "@/lib/import/types";

/**
 * Import page - Excel to PDF conversion wizard
 * Handles file upload, preview, validation, and PDF generation
 * Uses modern landing page design patterns with light/dark mode support
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
    <div className="min-h-screen bg-white dark:bg-[#101922] font-sans antialiased">
      {/* Sticky Header with backdrop blur */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#101922]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/home"
                className="flex items-center gap-2 text-gray-600 hover:text-[#137fec] dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back to Home</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[#137fec]">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">Import Logbook</span>
            </div>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Step Progress - Horizontal connected steps */}
        <div className="relative mb-16">
          <div className="hidden sm:block absolute top-6 left-[16%] right-[16%] h-0.5 bg-gray-200 dark:bg-gray-700" />
          <div className="flex justify-between sm:justify-around">
            <StepIndicator
              step={1}
              label="Upload Excel"
              icon="cloud_upload"
              active={!importJob}
              complete={!!importJob}
            />
            <StepIndicator
              step={2}
              label="Review & Validate"
              icon="fact_check"
              active={!!importJob && !pdfExport?.downloadUrl}
              complete={pdfExport?.status === "complete"}
            />
            <StepIndicator
              step={3}
              label="Export & Download"
              icon="download"
              active={pdfExport?.status === "complete"}
              complete={false}
            />
          </div>
        </div>

        {/* Upload Step */}
        {!importJob && (
          <div className="space-y-8">
            {/* Hero Section for Upload */}
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#137fec] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#137fec]"></span>
                </span>
                <span className="text-xs font-semibold text-[#137fec] uppercase tracking-wide">Step 1 of 3</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Upload Your Excel Logbook
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Import your TCCA/EASA Excel logbook to generate compliant PDFs and build your pilot portfolio.
              </p>
            </div>
            
            <FileUploader
              onFileSelect={handleFileSelect}
              isLoading={isLoading}
              error={error}
            />

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Secure Upload</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>TCCA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>EASA Compliant</span>
              </div>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {importJob && !pdfExport?.downloadUrl && (
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 mb-6">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">File Imported Successfully</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Review Your Data
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                <span className="font-semibold text-[#137fec]">{importJob.totalRows} flights</span> imported from{" "}
                <span className="font-medium">{importJob.fileName}</span>
              </p>
            </div>

            {/* Validation Summary */}
            <ValidationSummary validation={importJob.validation} flights={importJob.flights} />

            {/* Excel Logbook Dashboard - Matching Excel format for verification */}
            <ExcelLogbookDashboard flights={importJob.flights} />

            {/* Flight Preview Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Flight Preview</h3>
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                  Showing first 10 of {importJob.flights.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr className="text-gray-600 dark:text-gray-300 text-left">
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Aircraft</th>
                      <th className="px-6 py-3 font-semibold">Registration</th>
                      <th className="px-6 py-3 font-semibold">Route</th>
                      <th className="px-6 py-3 font-semibold text-right">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {importJob.flights.slice(0, 10).map((flight, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 dark:text-white">
                          {flight.flightDate.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{flight.aircraftMakeModel}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-xs font-medium text-[#137fec]">
                            {flight.registration}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          <span className="font-medium">{flight.departureAirport}</span>
                          <span className="mx-2 text-gray-400">→</span>
                          <span className="font-medium">{flight.arrivalAirport}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                          {flight.flightHours.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importJob.flights.length > 10 && (
                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ... and <span className="font-semibold">{importJob.flights.length - 10}</span> more flights
                  </p>
                </div>
              )}
            </div>

            {/* Save Result Message */}
            {saveResult && (
              <div
                className={`p-4 rounded-xl border ${
                  saveResult.success 
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30" 
                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  {saveResult.success ? (
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                  <p className={`font-medium ${saveResult.success ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                    {saveResult.message}
                  </p>
                </div>
              </div>
            )}

            {/* Actions - Feature Grid Style */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={handleReset}
                className="group p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Upload Different File</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Start over with a new file</p>
              </button>

              <button
                onClick={handleSaveToLogbook}
                disabled={isSaving || saveResult?.success}
                className="group p-4 bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-800/30 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {isSaving ? (
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : saveResult?.success ? (
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  )}
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {isSaving ? "Saving..." : saveResult?.success ? "Saved!" : "Save to Logbook"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Store flights in your account</p>
              </button>

              <button
                onClick={handleViewPortfolio}
                className="group p-4 bg-white dark:bg-gray-800 rounded-xl border border-purple-200 dark:border-purple-800/30 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">View Pilot Portfolio</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Career summary & analytics</p>
              </button>

              <button
                onClick={handleGeneratePdf}
                disabled={pdfExport?.status === "generating"}
                className="group p-4 bg-[#137fec] hover:bg-blue-600 rounded-xl border border-transparent hover:shadow-lg transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-white text-sm">
                  {pdfExport?.status === "generating" ? "Generating..." : "Generate PDF"}
                </p>
                <p className="text-xs text-blue-100 mt-1">TCCA compliant format</p>
              </button>
            </div>

            {/* Generation Progress */}
            {pdfExport?.status === "generating" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#137fec] animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Generating PDF...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">This may take a few seconds</p>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#137fec] transition-all duration-300 rounded-full"
                    style={{ width: `${pdfExport.progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {pdfExport?.status === "error" && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="font-medium text-red-700 dark:text-red-400">{pdfExport.error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Download Step - Success State */}
        {pdfExport?.status === "complete" && pdfExport.downloadUrl && (
          <div className="text-center space-y-8">
            {/* Success Animation */}
            <div className="relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-green-100 dark:bg-green-900/20 rounded-full blur-2xl" />
              <div className="relative w-24 h-24 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center border-4 border-green-200 dark:border-green-800/30">
                <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <div className="max-w-md mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                PDF Ready!
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Your TCCA-compliant logbook PDF has been generated and is ready for download.
              </p>
            </div>

            {/* File Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">{pdfExport.fileName}</p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  {importJob?.totalRows} flights
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {pdfExport.totalPages} pages
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={handleDownload}
                className="px-8 py-3 bg-[#137fec] text-white font-bold rounded-lg hover:bg-blue-600 transition-all shadow-lg hover:shadow-[#137fec]/25 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </button>
            </div>

            {/* Additional Actions */}
            <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">What would you like to do next?</p>
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={handleViewPortfolio}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#137fec] hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Pilot Portfolio
                </button>
                <Link
                  href="/home"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#137fec] hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Step indicator component - Horizontal connected steps with icons
 * Uses modern design patterns with hover effects and status indicators
 */
function StepIndicator({
  step,
  label,
  icon,
  active,
  complete,
}: {
  step: number;
  label: string;
  icon: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center text-center group">
      <div
        className={`
          w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-2 transition-all
          ${complete 
            ? "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800/30" 
            : active 
              ? "bg-[#137fec] border border-[#137fec] shadow-lg shadow-[#137fec]/25" 
              : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          }
          ${active && !complete ? "group-hover:shadow-xl" : ""}
        `}
      >
        {complete ? (
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : icon === "cloud_upload" ? (
          <svg className={`w-6 h-6 sm:w-7 sm:h-7 ${active ? "text-white" : "text-gray-400 dark:text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        ) : icon === "fact_check" ? (
          <svg className={`w-6 h-6 sm:w-7 sm:h-7 ${active ? "text-white" : "text-gray-400 dark:text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ) : (
          <svg className={`w-6 h-6 sm:w-7 sm:h-7 ${active ? "text-white" : "text-gray-400 dark:text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
      </div>
      <span className={`text-xs sm:text-sm font-medium ${
        complete 
          ? "text-green-600 dark:text-green-400" 
          : active 
            ? "text-gray-900 dark:text-white" 
            : "text-gray-400 dark:text-gray-500"
      }`}>
        {label}
      </span>
    </div>
  );
}

/**
 * Validation summary component - Card-based design with status indicators
 * Shows flight validation results with success/warning/error counts
 * Expandable to show detailed issues
 */
function ValidationSummary({ 
  validation, 
  flights,
}: { 
  validation: ValidationResult;
  flights: ParsedFlight[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { totalFlights, successCount, warningCount, errorCount, isValid, issues } = validation;
  
  // Group issues by row number and get the affected flights
  const affectedFlights = useMemo(() => {
    const rowsWithIssues = new Set(issues.map(i => i.rowNumber));
    return flights
      .filter(f => rowsWithIssues.has(f.rowNumber))
      .map(flight => ({
        flight,
        issues: issues.filter(i => i.rowNumber === flight.rowNumber),
        hasErrors: issues.some(i => i.rowNumber === flight.rowNumber && i.severity === 'error'),
        hasWarnings: issues.some(i => i.rowNumber === flight.rowNumber && i.severity === 'warning'),
      }))
      .sort((a, b) => {
        // Errors first, then warnings
        if (a.hasErrors && !b.hasErrors) return -1;
        if (!a.hasErrors && b.hasErrors) return 1;
        return a.flight.rowNumber - b.flight.rowNumber;
      });
  }, [flights, issues]);

  const hasIssues = errorCount > 0 || warningCount > 0;
  
  return (
    <div
      className={`rounded-2xl border overflow-hidden ${
        isValid 
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30" 
          : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/30"
      }`}
    >
      {/* Header - Clickable to expand */}
      <button
        onClick={() => hasIssues && setIsExpanded(!isExpanded)}
        disabled={!hasIssues}
        className={`w-full p-6 text-left flex items-start gap-4 ${hasIssues ? 'cursor-pointer hover:bg-yellow-100/50 dark:hover:bg-yellow-900/30 transition-colors' : ''}`}
      >
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
          isValid 
            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
        }`}>
          {isValid ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <h4 className={`font-bold text-lg ${
            isValid 
              ? "text-green-700 dark:text-green-400" 
              : "text-yellow-700 dark:text-yellow-400"
          }`}>
            {isValid ? "All flights validated successfully" : "Some flights need attention"}
          </h4>
          <div className="flex flex-wrap gap-4 mt-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-semibold">{successCount}</span> valid
              </span>
            </div>
            {warningCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">{warningCount}</span> warnings
                </span>
              </div>
            )}
            {errorCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">{errorCount}</span> errors
                </span>
              </div>
            )}
          </div>
        </div>
        {hasIssues && (
          <div className="shrink-0 self-center">
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </button>

      {/* Expanded Content - Flights needing attention */}
      {isExpanded && hasIssues && (
        <div className="border-t border-yellow-200 dark:border-yellow-800/30">
          <div className="p-4 bg-white/50 dark:bg-slate-900/50">
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Flights Requiring Review ({affectedFlights.length})
            </h5>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {affectedFlights.map(({ flight, issues, hasErrors }) => (
                <div 
                  key={flight.rowNumber}
                  className={`rounded-xl border p-4 ${
                    hasErrors 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/30'
                  }`}
                >
                  {/* Flight Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        hasErrors 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      }`}>
                        Row {flight.rowNumber}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {flight.flightDate.toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {flight.aircraftMakeModel}
                      </span>
                      {flight.registration && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-xs font-medium text-blue-600 dark:text-blue-400">
                          {flight.registration}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {flight.flightHours.toFixed(1)}h
                    </span>
                  </div>
                  
                  {/* Route info if available */}
                  {(flight.departureAirport || flight.arrivalAirport) && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span className="font-medium">{flight.departureAirport || '?'}</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{flight.arrivalAirport || '?'}</span>
                    </div>
                  )}
                  
                  {/* Issues List */}
                  <div className="space-y-2">
                    {issues.map((issue, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-start gap-2 text-sm ${
                          issue.severity === 'error' 
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-yellow-700 dark:text-yellow-400'
                        }`}
                      >
                        {issue.severity === 'error' ? (
                          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                          </svg>
                        )}
                        <div>
                          <span className="font-medium">{formatFieldName(issue.field)}:</span>{' '}
                          <span>{issue.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Format field names for display (camelCase to readable)
 */
function formatFieldName(field: string): string {
  const fieldNames: Record<string, string> = {
    flightHours: 'Flight Hours',
    flightDate: 'Date',
    aircraftMakeModel: 'Aircraft',
    registration: 'Registration',
    seDayDual: 'SE Day Dual',
    seDayPic: 'SE Day PIC',
    seNightDual: 'SE Night Dual',
    seNightPic: 'SE Night PIC',
    meDayDual: 'ME Day Dual',
    meDayPic: 'ME Day PIC',
    meNightDual: 'ME Night Dual',
    meNightPic: 'ME Night PIC',
    xcDayDual: 'XC Day Dual',
    xcDayPic: 'XC Day PIC',
    xcNightDual: 'XC Night Dual',
    xcNightPic: 'XC Night PIC',
    actualImc: 'Actual IMC',
    hood: 'Hood',
    simulator: 'Simulator',
    asFlightInstructor: 'As Instructor',
    dualReceived: 'Dual Received',
  };
  return fieldNames[field] || field.replace(/([A-Z])/g, ' $1').trim();
}
