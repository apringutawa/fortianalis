'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, AlertCircle, FileText, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';

export interface AnalysisResult {
  file_id: string;
  filename: string;
  is_demo: boolean;
  data: {
    stats: {
      totalRequests: number;
      totalAttacks: number;
      blockedAttacks: number;
      uniqueIps: number;
      blockRate: number;
    };
    timelineData: { time: string; attacks: number }[];
    attackTypes: { name: string; value: number }[];
    subdomains: { name: string; attacks: number; ip?: string; hostname?: string; country?: string }[];
    attackerIPs: { ip: string; country: string; count: number; risk: string }[];
  };
  ai_insight: {
    analysis: string;
    recommendation: string;
    powered_by: string;
  };
}

interface UploadDropzoneProps {
  onUploadSuccess: (result: AnalysisResult) => void;
}

export default function UploadDropzone({ onUploadSuccess }: UploadDropzoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > 50 * 1024 * 1024) {
        setError('File melebihi batas 50 MB.');
        return;
      }

      setError(null);
      setFileName(file.name);
      setIsUploading(true);
      setProgress(5);

      // Smooth fake progress while waiting for the API
      const interval = setInterval(() => {
        setProgress((p) => (p >= 85 ? 85 : p + 6));
      }, 400);

      try {
        const form = new FormData();
        form.append('file', file);

        const res = await fetch(`${API_URL}/api/v1/upload/`, {
          method: 'POST',
          body: form,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: 'Upload gagal.' }));
          throw new Error(err.detail || 'Upload gagal.');
        }

        const data: AnalysisResult = await res.json();

        clearInterval(interval);
        setProgress(100);

        setTimeout(() => {
          setIsUploading(false);
          onUploadSuccess(data);
        }, 600);
      } catch (err: unknown) {
        clearInterval(interval);
        setIsUploading(false);
        setProgress(0);
        const message = err instanceof Error ? err.message : 'Terjadi kesalahan.';
        setError(message);
      }
    },
    [onUploadSuccess],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain':  ['.log', '.txt'],
      'text/csv':    ['.csv'],
      'application/octet-stream': ['.log'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <div
        {...getRootProps()}
        className={[
          'relative overflow-hidden rounded-2xl border-2 border-dashed p-12 text-center',
          'transition-all duration-300 cursor-pointer',
          'bg-white/5 backdrop-blur-xl border-white/10',
          isDragActive
            ? 'border-cyan-400 bg-cyan-400/10 scale-[1.02] shadow-[0_0_40px_rgba(6,182,212,0.2)]'
            : 'hover:border-cyan-400/50 hover:bg-white/10',
          isUploading ? 'pointer-events-none opacity-80' : '',
        ].join(' ')}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Icon */}
          <div
            className={[
              'p-5 rounded-full',
              'bg-gradient-to-br from-cyan-500/20 to-blue-600/20',
              'ring-1 ring-white/10',
              isDragActive ? 'animate-bounce' : '',
            ].join(' ')}
          >
            {isUploading ? (
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
            ) : fileName ? (
              <FileText className="w-12 h-12 text-cyan-400" />
            ) : (
              <UploadCloud className="w-12 h-12 text-cyan-400" />
            )}
          </div>

          {/* Text */}
          <div>
            {isUploading ? (
              <>
                <p className="text-xl font-medium text-slate-200">
                  Menganalisa <span className="text-cyan-400">{fileName}</span>…
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Memproses log & generate AI insight
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-medium text-slate-200">
                  {isDragActive ? 'Lepaskan file di sini…' : 'Drag & drop log FortiWeb'}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  Format: .log · .txt · .csv &nbsp;|&nbsp; Maks 50 MB
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  atau klik untuk memilih file
                </p>
              </>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {isUploading && (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-slate-800/80">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-3 text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">{error}</p>
            <p className="text-xs text-red-400/70 mt-1">
              Pastikan backend berjalan di <code className="font-mono">{API_URL}</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
