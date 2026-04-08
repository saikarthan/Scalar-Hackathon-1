"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Activity,
  ShieldCheck,
  Zap,
  ChevronRight,
  LayoutDashboard,
  Bell,
  Settings,
  RefreshCw
} from "lucide-react";

type Stats = {
  avg_score: number;
  sla_compliance: number;
  total_tickets: number;
  critical_incidents: number;
  uptime_seconds: number;
  by_category: { [key: string]: number };
  recent_scores: number[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/admin/stats");
      const data = await resp.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)]">
      <Sidebar />
      
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="console-header">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <BarChart3 size={14} /> Management Console <ChevronRight size={12} /> 
            <span className="text-white">Executive Analytics</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
             <button onClick={fetchStats} className="text-muted hover:text-white transition-colors flex items-center gap-2 text-[10px] font-bold uppercase">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Data
            </button>
            <div className="h-4 w-px bg-subtle" />
            <button className="text-muted hover:text-white transition-colors">
              <Bell size={18} />
            </button>
            <button className="text-muted hover:text-white transition-colors">
              <Settings size={18} />
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">Executive Operations Dashboard</h1>
            <p className="text-sm text-muted">Real-time oversight of AI triage performance and SLA compliance across all departments.</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="console-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                  <TrendingUp size={20} />
                </div>
                <span className="text-[10px] font-bold text-brand-success bg-brand-success/10 px-2 py-0.5 rounded">+12%</span>
              </div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Average Compliance</p>
              <h3 className="text-3xl font-bold font-mono tracking-tight">{stats?.avg_score.toFixed(3) || "0.000"}</h3>
              <p className="text-[10px] text-muted mt-2 italic">Target: 0.950+</p>
            </div>

            <div className="console-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-brand-success/10 rounded-lg text-brand-success">
                  <ShieldCheck size={20} />
                </div>
                <span className="text-[10px] font-bold text-brand-success bg-brand-success/10 px-2 py-0.5 rounded">Steady</span>
              </div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">SLA Compliance Rate</p>
              <h3 className="text-3xl font-bold font-mono tracking-tight">{stats?.sla_compliance || "0.0"}%</h3>
              <p className="text-[10px] text-muted mt-2 italic">Industry Benchmark: 98%</p>
            </div>

            <div className="console-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-brand-warning/10 rounded-lg text-brand-warning">
                  <AlertTriangle size={20} />
                </div>
                <span className="text-[10px] font-bold text-brand-danger bg-brand-danger/10 px-2 py-0.5 rounded">High Risk</span>
              </div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Critical Incidents</p>
              <h3 className="text-3xl font-bold font-mono tracking-tight text-brand-danger">{stats?.critical_incidents || 0}</h3>
              <p className="text-[10px] text-muted mt-2 italic">Pending expert verification</p>
            </div>

            <div className="console-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-zinc-700/20 rounded-lg text-muted">
                  <Activity size={20} />
                </div>
              </div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">System Uptime</p>
              <h3 className="text-3xl font-bold font-mono tracking-tight">{stats ? formatUptime(stats.uptime_seconds) : "0h 0m 0s"}</h3>
              <div className="text-[10px] text-brand-success mt-2 font-bold uppercase tracking-widest flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-brand-success rounded-full animate-pulse" /> Live & Operational
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category Distribution Chart */}
            <div className="console-card flex flex-col">
              <div className="px-6 py-4 border-b border-subtle">
                <h3 className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                  <Zap size={16} className="text-brand-primary" /> Traffic by Category
                </h3>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center space-y-6">
                {stats?.by_category && Object.entries(stats.by_category).map(([cat, count]) => (
                  <div key={cat} className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                      <span>{cat}</span>
                      <span className="text-muted">{count} tickets</span>
                    </div>
                    <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-brand-primary transition-all duration-1000" 
                        style={{ width: `${stats.total_tickets > 0 ? (count / stats.total_tickets) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
                {!stats?.total_tickets && (
                  <div className="text-center py-12">
                    <p className="text-xs text-muted italic">No classification data available yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Accuracy Trends */}
            <div className="console-card flex flex-col">
              <div className="px-6 py-4 border-b border-subtle">
                <h3 className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 size={16} className="text-brand-success" /> Model Quality Trend
                </h3>
              </div>
              <div className="p-6 flex-1 flex items-end gap-2 min-h-[200px]">
                {stats?.recent_scores?.map((score, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div 
                      className="w-full bg-brand-success/20 border border-brand-success/40 rounded-t-sm transition-all duration-500 group-hover:bg-brand-success/40" 
                      style={{ height: `${score * 100}%` }}
                    />
                    <span className="text-[10px] font-mono text-muted transform -rotate-45 mt-2">v{i+1}</span>
                  </div>
                ))}
                 {!stats?.recent_scores?.length && (
                  <div className="w-full text-center py-12">
                    <p className="text-xs text-muted italic">Awaiting session completion...</p>
                  </div>
                )}
              </div>
              {(stats?.recent_scores?.length ?? 0) > 0 && (
                <div className="px-6 py-3 border-t border-subtle bg-black/10">
                  <p className="text-[10px] text-muted text-center tracking-wide">Last 10 triages across all model versions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
