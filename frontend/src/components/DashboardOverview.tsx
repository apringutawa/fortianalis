'use client';

import React from 'react';
import {
  ShieldAlert, ShieldCheck, Activity, Globe,
  Sparkles, TrendingUp, Bot, Cpu,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { AnalysisResult } from './UploadDropzone';

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

interface DashboardOverviewProps {
  result: AnalysisResult;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 flex items-center gap-4 hover:bg-white/8 transition-colors">
      <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const styles: Record<string, string> = {
    High:   'bg-red-500/15 text-red-400 border-red-500/30',
    Medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    Low:    'bg-green-500/15 text-green-400 border-green-500/30',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${styles[risk] ?? styles.Low}`}>
      {risk}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function DashboardOverview({ result }: DashboardOverviewProps) {
  const { data, ai_insight, is_demo } = result;
  const { stats, timelineData, attackTypes, subdomains, attackerIPs } = data;

  const fmt = (n: number) => n.toLocaleString('id-ID');
  const poweredByIcon = ai_insight.powered_by.includes('Gemini')
    ? <Sparkles className="w-4 h-4" />
    : <Cpu className="w-4 h-4" />;

  return (
    <div className="space-y-6">

      {/* Demo banner */}
      {is_demo && (
        <div className="flex items-center gap-3 px-5 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm">
          <Bot className="w-5 h-5 shrink-0" />
          <span>
            <strong>Demo Data:</strong> File tidak mengandung format log FortiWeb yang dikenali —
            ditampilkan data simulasi untuk preview dashboard.
          </span>
        </div>
      )}

      {/* ── Stats Row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={fmt(stats.totalRequests)}
          icon={Activity} color="text-blue-400" />
        <StatCard label="Total Attacks"  value={fmt(stats.totalAttacks)}
          icon={ShieldAlert} color="text-red-400"
          sub={`${((stats.totalAttacks / (stats.totalRequests || 1)) * 100).toFixed(1)}% attack rate`} />
        <StatCard label="Blocked Attacks" value={fmt(stats.blockedAttacks)}
          icon={ShieldCheck} color="text-emerald-400"
          sub={`${stats.blockRate}% block rate`} />
        <StatCard label="Unique IPs" value={fmt(stats.uniqueIps)}
          icon={Globe} color="text-cyan-400" />
      </div>

      {/* ── Charts Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Attack Timeline */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-medium text-slate-200">Attack Timeline</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line
                  type="monotone" dataKey="attacks" stroke="#06b6d4" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#06b6d4', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#06b6d4' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Subdomains */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
          <h3 className="text-base font-medium text-slate-200 mb-5">Top Subdomains Attacked</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subdomains.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#475569" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={130} stroke="#475569" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: 12 }}
                />
                <Bar dataKey="attacks" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Bottom Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Attack Types Pie */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
          <h3 className="text-base font-medium text-slate-200 mb-4">Attack Types</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attackTypes.slice(0, 6)}
                  cx="50%" cy="50%"
                  innerRadius={52} outerRadius={72}
                  paddingAngle={4} dataKey="value"
                >
                  {attackTypes.slice(0, 6).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
            {attackTypes.slice(0, 6).map((type, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {type.name}
              </div>
            ))}
          </div>
        </div>

        {/* Top Attacker IPs */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-base font-medium text-slate-200 mb-4">Top Attacker IPs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-white/10">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">IP Address</th>
                  <th className="pb-3 pr-4">Country</th>
                  <th className="pb-3 pr-4 text-right">Attacks</th>
                  <th className="pb-3">Risk</th>
                </tr>
              </thead>
              <tbody>
                {attackerIPs.slice(0, 8).map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-3 pr-4 text-slate-500 text-xs">{i + 1}</td>
                    <td className="py-3 pr-4 font-mono text-cyan-300 text-xs group-hover:text-cyan-200">
                      {row.ip}
                    </td>
                    <td className="py-3 pr-4 text-slate-400">{row.country}</td>
                    <td className="py-3 pr-4 text-right text-slate-200 font-medium">
                      {fmt(row.count)}
                    </td>
                    <td className="py-3">
                      <RiskBadge risk={row.risk} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {attackerIPs.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-6">No attacker IP data.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── AI Insight (Bottom) ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-purple-500/8 to-transparent border border-indigo-500/20 backdrop-blur-md rounded-2xl p-6">
        <div className="absolute -top-10 -right-10 w-52 h-52 bg-purple-600/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="flex items-start gap-4 relative z-10">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl mt-0.5 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-3 min-w-0">
            <h3 className="text-lg font-semibold text-indigo-300">AI Security Insight</h3>
            <div className="space-y-2 text-slate-300 text-sm leading-relaxed">
              <p>
                <strong className="text-slate-100">Analisis: </strong>
                {ai_insight.analysis}
              </p>
              <p>
                <strong className="text-slate-100">Rekomendasi: </strong>
                {ai_insight.recommendation}
              </p>
            </div>
            <div className="flex items-center gap-1.5 pt-1 text-xs text-slate-500">
              {poweredByIcon}
              <span>Powered by {ai_insight.powered_by}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
