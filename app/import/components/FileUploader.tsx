"use client";

import { useState, useCallback, useRef } from "react";

/**
 * FileUploader component - drag-and-drop upload zone for Excel files
 * Validates file type (.xlsx only) and file size (< 10MB)
 * Uses modern landing page design patterns with light/dark mode support
 */

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  error?: string | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const ACCEPTED_EXTENSION = ".xlsx";

export function FileUploader({ onFileSelect, isLoading, error }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.endsWith(ACCEPTED_EXTENSION)) {
      return "Please upload an Excel file (.xlsx)";
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than 10MB (current: ${(file.size / 1024 / 1024).toFixed(1)}MB)`;
    }
    
    return null;
  }, []);

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      return;
    }
    
    setValidationError(null);
    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const displayError = validationError || error;

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Upload Card */}
      <div
        onClick={!isLoading ? handleClick : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={!isLoading ? handleDrop : undefined}
        className={`
          relative p-8 sm:p-12 rounded-2xl transition-all duration-200 cursor-pointer
          bg-white dark:bg-gray-800 border-2 border-dashed
          ${isDragging
            ? "border-[#137fec] bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-[#137fec]/10"
            : "border-gray-200 dark:border-gray-700 hover:border-[#137fec] dark:hover:border-[#137fec] hover:shadow-lg"
          }
          ${isLoading ? "cursor-not-allowed opacity-60" : "group"}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSION}
          onChange={handleInputChange}
          className="hidden"
          disabled={isLoading}
        />
        
        <div className="flex flex-col items-center gap-6 text-center">
          {isLoading ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#137fec] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">Processing file...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This may take a few seconds</p>
              </div>
            </>
          ) : (
            <>
              {/* Icon with animation on hover */}
              <div className={`
                w-20 h-20 rounded-2xl flex items-center justify-center transition-all
                ${isDragging 
                  ? "bg-[#137fec] scale-110" 
                  : "bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 group-hover:bg-[#137fec]"
                }
              `}>
                <svg
                  className={`w-10 h-10 transition-colors ${
                    isDragging 
                      ? "text-white" 
                      : "text-[#137fec] group-hover:text-white"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              
              {/* Text Content */}
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {isDragging ? "Drop your file here" : "Drag and drop your Excel file"}
                </p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  or <span className="text-[#137fec] font-medium hover:underline">browse</span> to choose a file
                </p>
              </div>
              
              {/* File Type Info */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-700 w-full justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">.xlsx files</span>
                </div>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Max 10MB</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Error Message */}
      {displayError && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {displayError}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
