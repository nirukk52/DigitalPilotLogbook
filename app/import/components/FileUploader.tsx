"use client";

import { useState, useCallback, useRef } from "react";

/**
 * FileUploader component - drag-and-drop upload zone for Excel files
 * Validates file type (.xlsx only) and file size (< 10MB)
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
    <div className="w-full max-w-lg mx-auto">
      <div
        onClick={!isLoading ? handleClick : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={!isLoading ? handleDrop : undefined}
        className={`
          relative border-2 border-dashed rounded-xl p-8
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? "border-purple-500 bg-purple-500/10"
            : "border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10"
          }
          ${isLoading ? "cursor-not-allowed opacity-60" : ""}
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
        
        <div className="flex flex-col items-center gap-4 text-center">
          {isLoading ? (
            <>
              <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              <p className="text-white/80">Processing file...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-purple-400"
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
              
              <div>
                <p className="text-white font-medium">
                  {isDragging ? "Drop your file here" : "Drag and drop your Excel file"}
                </p>
                <p className="text-white/60 text-sm mt-1">
                  or click to browse
                </p>
              </div>
              
              <p className="text-white/40 text-xs">
                Supports .xlsx files up to 10MB
              </p>
            </>
          )}
        </div>
      </div>
      
      {displayError && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {displayError}
          </p>
        </div>
      )}
    </div>
  );
}
