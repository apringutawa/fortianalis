'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield, FileDown, ChevronDown, RotateCcw,
  Calendar, CalendarDays, CalendarRange, Loader2,
  FileText, FileSpreadsheet, FileType, Database,
} from 'lucide-react';
import UploadDropzone, { type AnalysisResult } from '@/components/UploadDropzone';
import DashboardOverview from '@/components/DashboardOverview';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';

type Period = 'full';
type ExportFormat = 'pdf' | 'word';

const PERIOD_OPTIONS: { value: Period; label: string; sub: string; icon: React.ElementType }[] = [
  { value: 'full',   label: 'Generate Report',   sub: 'Laporan Lengkap',        icon: FileText      },
];

const FORMAT_OPTIONS: { value: ExportFormat; label: string; ext: string; icon: React.ElementType; color: string }[] = [
  { value: 'pdf',   label: 'PDF',   ext: 'pdf',  icon: FileText,        color: 'text-red-400' },
  { value: 'word',  label: 'DOCX',  ext: 'docx', icon: FileType,        color: 'text-blue-400' },
];

export default function Home() {
  const [result, setResult]         = useState<AnalysisResult | null>(null);
  const [exporting, setExporting]   = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const handleUploadSuccess = (data: AnalysisResult) => setResult(data);
  const handleReset         = () => { setResult(null); setExportOpen(false); };

  const handleGenerateReport = async (format: ExportFormat) => {
    if (!result) return;
    setExporting(format);
    setExportOpen(false);

    try {
      // Build correct endpoint based on format
      const endpoint = format === 'pdf'
        ? `${API_URL}/api/v1/upload/export/${result.file_id}`
        : `${API_URL}/api/v1/upload/export/${result.file_id}/${format}`;

      const res = await fetch(endpoint);
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Gagal membuat laporan (${res.status}): ${errText || 'Report tidak ditemukan'}`);
      }

      const blob   = await res.blob();
      if (blob.size === 0) throw new Error('File laporan kosong.');
      const url    = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const ext    = FORMAT_OPTIONS.find((f) => f.value === format)?.ext || format;
      anchor.href  = url;
      anchor.download = `FortiAnalis_Report_${new Date().toISOString().slice(0, 10)}.${ext}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Report generation error:', e);
      alert((e as Error).message);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-cyan-500/30">

      {/* ── Ambient background ──────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] rounded-full bg-cyan-600/15 blur-[130px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full bg-blue-700/15 blur-[130px]" />
        <div className="absolute top-[40%] right-[25%] w-[20%] h-[20%] rounded-full bg-purple-700/10 blur-[100px]" />
      </div>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav
        className="relative z-10 border-b border-white/8 bg-slate-950/70 backdrop-blur-lg sticky top-0"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                FortiAnalis
              </span>
              <span className="ml-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                by KUBU RAYA CSIRT
              </span>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-3">
            {/* Report History Link */}
            <Link
              href="/reports"
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-slate-100 transition-colors rounded-lg hover:bg-white/5"
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Riwayat</span>
            </Link>

            {result && (
              <button
                id="btn-upload-new"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-slate-100 transition-colors rounded-lg hover:bg-white/5"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Upload Baru</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">

        {/* Upload screen */}
        {!result ? (
          <div className="flex flex-col items-center justify-center min-h-[72vh] space-y-8">
            <div className="text-center space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs text-cyan-400 font-medium mb-2">
                <Shield className="w-3.5 h-3.5" />
                FortiWeb WAF · AI-Powered Analysis
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Analisa Log FortiWeb{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  dalam Hitungan Detik
                </span>
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed">
                Upload file log WAF mentah — engine kami akan mem-parse, menganalisis,
                dan menghasilkan insight keamanan berbasis AI secara instan.
              </p>
            </div>

            <UploadDropzone onUploadSuccess={handleUploadSuccess} />

            {/* Feature hints */}
            <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-500 pt-2">
              {[
                'Real FortiWeb Parser',
                'AI Security Insight (Gemini)',
                'Export PDF / Excel / Word / CSV',
                'Riwayat Report Tersimpan',
              ].map((f) => (
                <span key={f} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  {f}
                </span>
              ))}
            </div>
          </div>
        ) : (
          /* Dashboard screen */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-slate-100">Analysis Dashboard</h1>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span>
                  File: <span className="text-slate-200 font-medium">{result.filename}</span>
                </span>
                <span className="text-slate-600">·</span>
                <span>
                  ID: <span className="font-mono text-cyan-400 text-xs">{result.file_id}</span>
                </span>
                {result.is_demo && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-amber-400 text-xs">Demo Data</span>
                  </>
                )}
              </div>
            </div>

            <DashboardOverview result={result} />

            {/* Export Section - Bottom */}
            <div className="mt-8 bg-gradient-to-br from-cyan-500/10 via-blue-500/8 to-transparent border border-cyan-500/20 backdrop-blur-md rounded-2xl p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl shrink-0">
                    <FileDown className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-1">Export Laporan Analisis</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Download laporan lengkap dengan narasi AI, kesimpulan, dan rekomendasi keamanan dalam format pilihan Anda.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 shrink-0">
                  {FORMAT_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      id={`btn-export-${value}`}
                      onClick={() => handleGenerateReport(value)}
                      disabled={!!exporting}
                      className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      {exporting === value ? (
                        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                      ) : (
                        <Icon className={`w-5 h-5 ${color} group-hover:scale-110 transition-transform`} />
                      )}
                      <div className="text-left">
                        <p className="text-sm font-medium text-slate-200">Export {label}</p>
                        <p className="text-[10px] text-slate-500">.{value}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
