'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Shield, ArrowLeft, FileText, FileSpreadsheet, FileType, FileDown,
  Search, Trash2, Calendar, Loader2, Database, Eye, AlertTriangle,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';

interface ReportSummary {
  id: string;
  filename: string;
  created_at: string;
  total_requests: number;
  total_attacks: number;
  blocked_attacks: number;
  unique_ips: number;
  block_rate: number;
  is_demo: boolean;
}

interface GlobalStats {
  total_reports: number;
  total_requests: number;
  total_attacks: number;
  total_blocked: number;
  avg_block_rate: number;
}

const EXPORT_FORMATS = [
  { key: 'pdf', label: 'PDF', icon: FileText, color: 'text-red-400 hover:bg-red-500/10' },
  { key: 'excel', label: 'Excel', icon: FileSpreadsheet, color: 'text-green-400 hover:bg-green-500/10' },
  { key: 'word', label: 'Word', icon: FileType, color: 'text-blue-400 hover:bg-blue-500/10' },
  { key: 'csv', label: 'CSV', icon: FileDown, color: 'text-yellow-400 hover:bg-yellow-500/10' },
];

function RiskBadge({ risk }: { risk: string }) {
  const styles: Record<string, string> = {
    High: 'bg-red-500/15 text-red-400 border-red-500/30',
    Medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    Low: 'bg-green-500/15 text-green-400 border-green-500/30',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${styles[risk] ?? styles.Low}`}>
      {risk}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: React.ElementType; sub?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-4 flex items-center gap-3">
      <div className="p-2.5 rounded-lg bg-white/5 text-cyan-400">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-lg font-bold text-slate-100">{typeof value === 'number' ? value.toLocaleString('id-ID') : value}</p>
        {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [resReports, resStats] = await Promise.all([
        fetch(`${API_URL}/api/v1/reports/?search=${encodeURIComponent(search)}&limit=100`),
        fetch(`${API_URL}/api/v1/reports/stats/summary`),
      ]);
      if (resReports.ok) setReports(await resReports.json());
      if (resStats.ok) setStats(await resStats.json());
    } catch (e) {
      console.error('Failed to fetch reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [search]);

  const handleExport = async (reportId: string, format: string) => {
    setExporting(`${reportId}-${format}`);
    try {
      const endpoint = format === 'pdf'
        ? `${API_URL}/api/v1/upload/export/${reportId}?period=daily`
        : `${API_URL}/api/v1/upload/export/${reportId}/${format}`;
      const res = await fetch(endpoint);
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Export gagal (${res.status}): ${errText || 'Report tidak ditemukan'}`);
      }
      const blob = await res.blob();
      if (blob.size === 0) throw new Error('File export kosong.');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const extMap: Record<string, string> = { pdf: 'pdf', excel: 'xlsx', word: 'docx', csv: 'csv' };
      anchor.download = `FortiAnalis_Report_${reportId.slice(0, 8)}.${extMap[format] || format}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error:', e);
      alert((e as Error).message || 'Export failed. Report may no longer be available.');
    } finally {
      setExporting(null);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Delete this report? This action cannot be undone.')) return;
    setDeleting(reportId);
    try {
      const res = await fetch(`${API_URL}/api/v1/reports/${reportId}`, { method: 'DELETE' });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      }
    } catch (e) {
      alert('Delete failed.');
    } finally {
      setDeleting(null);
    }
  };

  const fmtDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-cyan-500/30">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] rounded-full bg-cyan-600/15 blur-[130px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full bg-blue-700/15 blur-[130px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/8 bg-slate-950/70 backdrop-blur-lg sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-slate-400 hover:text-slate-100 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Kembali</span>
            </Link>
            <div className="h-5 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                  Riwayat Report
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-all border border-cyan-500/20 text-sm font-medium"
          >
            <Shield className="w-4 h-4" />
            Upload Baru
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Global Stats */}
        {stats && stats.total_reports > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="Total Report" value={stats.total_reports} icon={Database} />
            <StatCard label="Total Requests" value={stats.total_requests} icon={FileText} />
            <StatCard label="Total Attacks" value={stats.total_attacks} icon={AlertTriangle} />
            <StatCard label="Total Blocked" value={stats.total_blocked} icon={Shield} />
            <StatCard label="Avg Block Rate" value={`${stats.avg_block_rate}%`} icon={Database} />
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama file..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
          />
        </div>

        {/* Report List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20">
            <Database className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">Belum ada report.</p>
            <p className="text-slate-500 text-sm mt-1">Upload file log FortiWeb untuk mulai menganalisis.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/20 text-sm font-medium transition-all"
            >
              <Shield className="w-4 h-4" />
              Upload Log
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-5 hover:bg-white/8 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="font-medium text-slate-100 truncate">{report.filename}</span>
                      {report.is_demo && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          Demo
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {fmtDate(report.created_at)}
                      </span>
                      <span>Requests: <span className="text-slate-200">{report.total_requests.toLocaleString('id-ID')}</span></span>
                      <span>Attacks: <span className="text-red-400">{report.total_attacks.toLocaleString('id-ID')}</span></span>
                      <span>Blocked: <span className="text-emerald-400">{report.blocked_attacks.toLocaleString('id-ID')}</span></span>
                      <span>Block Rate: <span className="text-cyan-400 font-medium">{report.block_rate}%</span></span>
                      <span>IPs: <span className="text-slate-200">{report.unique_ips}</span></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {EXPORT_FORMATS.map(({ key, label, icon: Icon, color }) => {
                      const expKey = `${report.id}-${key}`;
                      return (
                        <button
                          key={key}
                          onClick={() => handleExport(report.id, key)}
                          disabled={exporting === expKey}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-xs font-medium transition-all ${color} disabled:opacity-50`}
                          title={`Export sebagai ${label}`}
                        >
                          {exporting === expKey ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Icon className="w-3.5 h-3.5" />
                          )}
                          {label}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handleDelete(report.id)}
                      disabled={deleting === report.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-xs font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                      title="Hapus report"
                    >
                      {deleting === report.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
