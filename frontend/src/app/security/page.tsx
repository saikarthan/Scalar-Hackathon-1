"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { 
  ShieldAlert, 
  Lock, 
  Key, 
  Fingerprint, 
  Activity, 
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Bell,
  Settings,
  MoreVertical,
  Terminal,
  FileSearch,
  Zap
} from "lucide-react";

export default function SecurityCenterPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resp = await fetch("/admin/stats");
        const data = await resp.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch security stats:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)]">
      <Sidebar />
      
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="console-header">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <ShieldAlert size={14} /> Security Center <ChevronRight size={12} /> 
            <span className="text-white">Threat Management Ops</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-brand-success bg-brand-success/10 px-3 py-1 rounded-full border border-brand-success/20">
              <ShieldCheck size={12} /> SYSTEM SECURE
            </div>
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
             <h1 className="text-2xl font-bold tracking-tight">Security Posture Dashboard</h1>
             <p className="text-sm text-muted">Monitor high-risk triage scenarios, PII leaks, and automated security escalations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="console-card p-6 border-l-4 border-brand-danger">
                <div className="flex justify-between items-start mb-4">
                   <div className="p-2 bg-brand-danger/10 rounded-lg text-brand-danger">
                     <AlertCircle size={20} />
                   </div>
                   <span className="text-[10px] font-bold text-brand-danger">ACTION REQUIRED</span>
                </div>
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Active High-Risk Cases</p>
                <h3 className="text-3xl font-bold font-mono tracking-tight text-white">{stats?.critical_incidents || 0}</h3>
                <p className="text-[10px] text-muted mt-2 italic">Including PII exposures & Data Access requests</p>
             </div>

             <div className="console-card p-6 border-l-4 border-brand-primary">
                <div className="flex justify-between items-start mb-4">
                   <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                     <Lock size={20} />
                   </div>
                   <span className="text-[10px] font-bold text-brand-primary">MONITORING</span>
                </div>
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Privacy Filter Hits</p>
                <h3 className="text-3xl font-bold font-mono tracking-tight text-white">128</h3>
                <p className="text-[10px] text-muted mt-2 italic">PII detection triggered in inbound mail</p>
             </div>

             <div className="console-card p-6 border-l-4 border-brand-success">
                <div className="flex justify-between items-start mb-4">
                   <div className="p-2 bg-brand-success/10 rounded-lg text-brand-success">
                     <ShieldCheck size={20} />
                   </div>
                   <span className="text-[10px] font-bold text-brand-success">ENFORCED</span>
                </div>
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Legal Escalation Rate</p>
                <h3 className="text-3xl font-bold font-mono tracking-tight text-white">100%</h3>
                <p className="text-[10px] text-muted mt-2 italic">Audit passed for all regulatory cases</p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="console-card flex flex-col">
                <div className="px-6 py-4 border-b border-subtle flex justify-between items-center">
                  <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                    <Terminal size={16} className="text-brand-primary" /> Security Events Log
                  </h3>
                   <button className="text-muted hover:text-white"><MoreVertical size={16}/></button>
                </div>
                <div className="p-6 flex-1 space-y-4 font-mono text-[10px] bg-[#0b0e14]/50">
                   <p className="text-brand-success">[OK] System Integrity Check Passed</p>
                   <p className="text-brand-warning">[WARN] PII Cluster Detected in ticket INC-4002</p>
                   <p className="text-brand-primary">[INFO] Automatic RAG Policy Retrieval for GDPR-RTBF</p>
                   <p className="text-brand-warning">[WARN] Multiple Access Failures from IP: 192.168.1.104</p>
                   <p className="text-muted italic underline cursor-pointer hover:text-white transition-colors">VIEW ALL SYSTEM AUDIT LOGS →</p>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-4">
                <div className="console-card p-5 group hover:border-brand-primary transition-all">
                   <div className="flex gap-4 items-center">
                      <div className="p-3 bg-zinc-700/20 rounded text-brand-primary"><Key size={20} /></div>
                      <div className="flex-1">
                         <h4 className="text-sm font-bold">Access & Identity Center</h4>
                         <p className="text-[11px] text-muted">Manage corporate auth policies and SSO integrations.</p>
                      </div>
                      <ChevronRight size={18} className="text-muted group-hover:text-white" />
                   </div>
                </div>
                <div className="console-card p-5 group hover:border-brand-primary transition-all">
                   <div className="flex gap-4 items-center">
                      <div className="p-3 bg-zinc-700/20 rounded text-brand-primary"><FileSearch size={20} /></div>
                      <div className="flex-1">
                         <h4 className="text-sm font-bold">Compliance Reporting</h4>
                         <p className="text-[11px] text-muted">Generate audit reports for GDPR, SOC2, and HIPAA.</p>
                      </div>
                      <ChevronRight size={18} className="text-muted group-hover:text-white" />
                   </div>
                </div>
                <div className="console-card p-5 group hover:border-brand-primary transition-all">
                   <div className="flex gap-4 items-center">
                      <div className="p-3 bg-zinc-700/20 rounded text-brand-primary"><Zap size={20} /></div>
                      <div className="flex-1">
                         <h4 className="text-sm font-bold">Automated Remediation</h4>
                         <p className="text-[11px] text-muted">Configure playbooks for instant security response.</p>
                      </div>
                      <ChevronRight size={18} className="text-muted group-hover:text-white" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
