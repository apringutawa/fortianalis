'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UploadDropzoneProps {
  onUploadSuccess: (reportId: string) => void;
}

export default function UploadDropzone({ onUploadSuccess }: UploadDropzoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit.');
      return;
    }

    setError(null);
    setIsUploading(true);
    setProgress(0); // Optional: implement real progress with XMLHttpRequest later

    // Simulate progress while waiting for response
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 500);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';
      const response = await fetch(`${API_URL}/api/v1/upload/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setIsUploading(false);
        onUploadSuccess(data.file_id || 'new-report-id');
      }, 500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setIsUploading(false);
      setProgress(0);
      setError(err.message || 'An unexpected error occurred during upload.');
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.log', '.txt'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <div
        {...getRootProps()}
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300",
          "bg-white/5 backdrop-blur-xl border-white/10 hover:border-cyan-400/50 hover:bg-white/10",
          isDragActive && "border-cyan-400 bg-cyan-400/10 scale-[1.02]",
          isUploading && "pointer-events-none opacity-80"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={cn(
            "p-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20",
            isDragActive && "animate-bounce"
          )}>
            <UploadCloud className="w-12 h-12 text-cyan-400" />
          </div>
          
          <div>
            <p className="text-xl font-medium text-slate-200">
              {isDragActive ? "Drop the log file here..." : "Drag & drop FortiWeb log"}
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Supports .log, .txt, .csv up to 50MB
            </p>
          </div>
        </div>

        {isUploading && (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
