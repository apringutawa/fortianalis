'use client';

import React from 'react';
import { ShieldAlert, ShieldCheck, Activity, Globe, Sparkles } from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const mockTimelineData = [
  { time: '00:00', attacks: 120 },
  { time: '04:00', attacks: 300 },
  { time: '08:00', attacks: 150 },
  { time: '12:00', attacks: 800 },
  { time: '16:00', attacks: 400 },
  { time: '20:00', attacks: 200 },
];

const mockAttackTypes = [
  { name: 'SQLi', value: 450 },
  { name: 'XSS', value: 300 },
  { name: 'Path Traversal', value: 200 },
  { name: 'Bot', value: 150 },
];

const mockSubdomains = [
  { name: 'api.example.com', attacks: 800 },
  { name: 'auth.example.com', attacks: 600 },
  { name: 'www.example.com', attacks: 200 },
];

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function DashboardOverview() {
  return (
    <div className="space-y-6">

      {/* AI Insights Card */}
      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 p-12 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex items-start gap-4 relative z-10">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl mt-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="text-lg font-semibold text-indigo-300">AI Generated Security Insight</h3>
            <div className="space-y-2 text-slate-300 text-sm leading-relaxed">
              <p>
                <strong className="text-slate-100">Analisis:</strong> Terdeteksi lonjakan aktivitas tidak wajar sebesar <span className="text-red-400 font-bold">40%</span> pada <code className="bg-slate-800 px-1 py-0.5 rounded text-cyan-400">api.example.com</code> antara jam 12:00 hingga 14:00. Serangan didominasi oleh percobaan <strong>SQL Injection</strong> yang berasal dari IP range Rusia dan Tiongkok.
              </p>
              <p>
                <strong className="text-slate-100">Rekomendasi Tindakan:</strong> WAF saat ini berhasil memblokir 98% serangan. Namun, disarankan untuk melakukan evaluasi <em>rate-limiting</em> spesifik pada endpoint <code>/v1/login</code> dan memastikan database sudah mengimplementasikan <em>prepared statements</em>.
              </p>
            </div>
            <div className="pt-2">
              <span className="text-xs text-slate-500">Powered by Gemini AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: '45,231', icon: Activity, color: 'text-blue-400' },
          { label: 'Total Attacks', value: '2,104', icon: ShieldAlert, color: 'text-red-400' },
          { label: 'Blocked Attacks', value: '2,080', icon: ShieldCheck, color: 'text-green-400' },
          { label: 'Unique IPs', value: '843', icon: Globe, color: 'text-emerald-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
          <h3 className="text-lg font-medium text-slate-200 mb-6">Attack Timeline</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTimelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="attacks" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subdomain Distribution */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
          <h3 className="text-lg font-medium text-slate-200 mb-6">Top Subdomains Attacked</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockSubdomains} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" width={120} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
                <Bar dataKey="attacks" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 lg:col-span-1">
          <h3 className="text-lg font-medium text-slate-200 mb-6">Attack Types</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockAttackTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockAttackTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {mockAttackTypes.map((type, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {type.name}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 lg:col-span-2">
           <h3 className="text-lg font-medium text-slate-200 mb-6">Top Attacker IPs</h3>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left text-slate-300">
               <thead className="text-xs text-slate-400 uppercase bg-white/5">
                 <tr>
                   <th className="px-6 py-3 rounded-tl-lg">IP Address</th>
                   <th className="px-6 py-3">Country</th>
                   <th className="px-6 py-3">Total Attacks</th>
                   <th className="px-6 py-3 rounded-tr-lg">Risk</th>
                 </tr>
               </thead>
               <tbody>
                 {[
                   { ip: '192.168.1.100', country: 'RU', count: 450, risk: 'High' },
                   { ip: '10.0.0.55', country: 'CN', count: 320, risk: 'High' },
                   { ip: '172.16.0.12', country: 'US', count: 150, risk: 'Medium' },
                 ].map((row, i) => (
                   <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                     <td className="px-6 py-4 font-mono">{row.ip}</td>
                     <td className="px-6 py-4">{row.country}</td>
                     <td className="px-6 py-4">{row.count}</td>
                     <td className="px-6 py-4 text-red-400">{row.risk}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
}
