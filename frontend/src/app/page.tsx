'use client';

import { useState } from 'react';
import { Shield, FileDown, ChevronDown } from 'lucide-react';
import UploadDropzone from '@/components/UploadDropzone';
import DashboardOverview from '@/components/DashboardOverview';

export default function Home() {
  const [reportId, setReportId] = useState<string | null>(null);

  const handleUploadSuccess = (id: string) => {
    setReportId(id);
  };

  const handleReset = () => {
    setReportId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-cyan-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
              FortiAnalis
            </span>
          </div>
          
          {reportId && (
            <div className="flex items-center gap-4">
              <button 
                onClick={handleReset}
                className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Upload New
              </button>
              
              {/* Dropdown Export */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-all border border-cyan-500/20 hover:border-cyan-500/50">
                  <FileDown className="w-4 h-4" />
                  <span>Export Report</span>
                  <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 py-2 bg-slate-800 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Pilih Periode
                  </div>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/10 hover:text-cyan-400 transition-colors">
                    Harian (Daily)
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/10 hover:text-cyan-400 transition-colors">
                    Mingguan (Weekly)
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/10 hover:text-cyan-400 transition-colors">
                    Bulanan (Monthly)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {!reportId ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
            <div className="text-center space-y-4 max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Analyze FortiWeb Logs in <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Seconds</span>
              </h1>
              <p className="text-lg text-slate-400">
                Upload your raw WAF logs and let our engine parse, analyze, and generate actionable insights instantly.
              </p>
            </div>
            <UploadDropzone onUploadSuccess={handleUploadSuccess} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-slate-100">Analysis Dashboard</h1>
              <p className="text-slate-400 text-sm">Showing insights for Report ID: <span className="font-mono text-cyan-400">{reportId}</span></p>
            </div>
            <DashboardOverview />
          </div>
        )}
      </main>
    </div>
  );
}
