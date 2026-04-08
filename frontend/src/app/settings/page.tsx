"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { 
  Mail, 
  Shield, 
  UserPlus, 
  Sliders, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Globe, 
  Lock, 
  Terminal, 
  Key,
  Server,
  Activity,
  Zap,
  LayoutDashboard,
  Settings as SettingsIcon,
  ShieldCheck,
  History,
  ArrowRight
} from "lucide-react";

export default function SettingsHub() {
  const [activeSubTab, setActiveSubTab] = useState("dashboard");
  const [imap, setImap] = useState({ host: "imap.gmail.com", user: "", pass: "" });
  const [zendesk, setZendesk] = useState({ subdomain: "", email: "", token: "" });
  const [members, setMembers] = useState<any[]>([]);
  const [newMember, setNewMember] = useState({ username: "", password: "", role: "analyst" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [sensitivity, setSensitivity] = useState(75);

  useEffect(() => {
    fetchMembers();
    fetchStats();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch("http://localhost:8001/api/admin/users");
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      console.error("Failed to fetch members");
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:8001/api/inbound/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats");
    }
  };

  const handleSaveIntegration = async () => {
    setLoading(true);
    setStatus({ type: "info", message: "Activating secure node link..." });
    try {
      const res = await fetch("http://localhost:8001/api/integration/imap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imap),
      });
      if (res.ok) {
        setStatus({ type: "success", message: "Node activated: Real-time Governance feed live." });
      } else {
        setStatus({ type: "error", message: "Link failed: Unauthorized connector handshake." });
      }
    } catch (err) {
      setStatus({ type: "error", message: "Shield interrupt: API unreachable." });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    try {
      const res = await fetch("http://localhost:8001/api/admin/users/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });
      if (res.ok) {
        fetchMembers();
        setNewMember({ username: "", password: "", role: "analyst" });
        setStatus({ type: "success", message: `Operator ${newMember.username} access authorized.` });
      }
    } catch (err) {
      setStatus({ type: "error", message: "Access denied: UID collision detected." });
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)] font-sans">
      <Sidebar />
      
      <main className="flex-1 ml-64 flex flex-col">
        {/* TOP CLOUD HEADER */}
        <header className="px-10 py-5 bg-[var(--bg-sidebar)] border-b border-subtle flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center border border-brand-primary/20">
                <SettingsIcon className="w-4 h-4 text-brand-primary" />
             </div>
             <div>
                <h1 className="text-xs font-black uppercase tracking-[0.2em] text-white">Governance Console</h1>
                <p className="text-[10px] text-muted font-bold">SENTINEL_NODE_V4_8001</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-2 h-2 rounded-full bg-brand-success shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                <span className="text-[9px] font-black text-white uppercase tracking-widest group-hover:text-brand-success transition-colors">GATE_ACTIVE</span>
             </div>
             <div className="w-px h-6 bg-white/5"></div>
             <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-muted uppercase">S_Admin</span>
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                   <div className="w-4 h-4 bg-white/20 rounded-full"></div>
                </div>
             </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          
          {/* NESTED SUB-SIDEBAR */}
          <nav className="w-72 bg-[#0d1117] border-r border-subtle p-8 space-y-6 overflow-y-auto shadow-2xl z-10">
             <div className="space-y-1">
                <h2 className="text-[10px] text-muted font-black uppercase tracking-[0.2em] mb-4 ml-2 italic">Triage_Core</h2>
                <button 
                  onClick={() => setActiveSubTab("dashboard")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-xs font-bold uppercase tracking-widest border ${
                    activeSubTab === "dashboard" ? "bg-white/5 border-white/10 text-white shadow-xl translate-x-2" : "bg-transparent border-transparent text-muted hover:text-white hover:translate-x-1"
                  }`}
                >
                  <LayoutDashboard size={14} /> Dashboard
                </button>
             </div>

             <div className="space-y-1">
                <h2 className="text-[10px] text-muted font-black uppercase tracking-[0.2em] mb-4 mt-8 ml-2 italic">Infrastructure</h2>
                <button 
                  onClick={() => setActiveSubTab("connectors")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-xs font-bold uppercase tracking-widest border ${
                    activeSubTab === "connectors" ? "bg-white/5 border-white/10 text-white shadow-xl translate-x-2" : "bg-transparent border-transparent text-muted hover:text-white hover:translate-x-1"
                  }`}
                >
                  <Globe size={14} /> Connectors
                </button>
                <button 
                  onClick={() => setActiveSubTab("rules")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-xs font-bold uppercase tracking-widest border ${
                    activeSubTab === "rules" ? "bg-white/5 border-white/10 text-white shadow-xl translate-x-2" : "bg-transparent border-transparent text-muted hover:text-white hover:translate-x-1"
                  }`}
                >
                  <Shield size={14} /> Risk Engine
                </button>
             </div>

             <div className="space-y-1">
                <h2 className="text-[10px] text-muted font-black uppercase tracking-[0.2em] mb-4 mt-8 ml-2 italic">Identity</h2>
                <button 
                  onClick={() => setActiveSubTab("iam")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-xs font-bold uppercase tracking-widest border ${
                    activeSubTab === "iam" ? "bg-white/5 border-white/10 text-white shadow-xl translate-x-2" : "bg-transparent border-transparent text-muted hover:text-white hover:translate-x-1"
                  }`}
                >
                  <Users size={14} /> Access Control
                </button>
             </div>
          </nav>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 bg-[var(--bg-main)] overflow-y-auto p-12 scrollbar-hide">
             <div className="max-w-4xl mx-auto space-y-12 pb-32">
                
                {/* Status System */}
                {status.message && (
                  <div className={`p-5 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 overflow-hidden relative ${
                    status.type === "success" ? "bg-brand-success/5 border-brand-success/20 text-brand-success" :
                    status.type === "error" ? "bg-brand-danger/5 border-brand-danger/20 text-brand-danger" :
                    "bg-brand-primary/5 border-brand-primary/20 text-brand-primary"
                  }`}>
                    {status.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    <span className="text-xs font-black uppercase tracking-tight">{status.message}</span>
                    <div className="absolute left-0 top-0 w-1 h-full bg-current opacity-40 animate-pulse"></div>
                  </div>
                )}

                {/* --- DASHBOARD VIEW --- */}
                {activeSubTab === "dashboard" && (
                   <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div>
                        <h2 className="text-3xl font-black tracking-tighter uppercase italic text-white mb-2 underline decoration-brand-primary decoration-4 underline-offset-8">Executive_Summary</h2>
                        <p className="text-[11px] text-muted font-bold tracking-[0.2em] uppercase">SYSTEM_STATE: NOMINAL // VPC_ACTIVE_PORT_8001</p>
                      </div>

                      <div className="grid grid-cols-4 gap-6">
                         {[
                           { label: "Inbound Guard", value: stats?.total_tickets || 0, icon: Activity, color: "text-brand-primary", unit: "PACKETS" },
                           { label: "Compliance", value: `${stats?.avg_score || 0}%`, icon: ShieldCheck, color: "text-brand-success", unit: "QUALITY" },
                           { label: "Risk Triage", value: stats?.active_risks || 0, icon: Zap, color: "text-brand-warning", unit: "INTERCEPTS" },
                           { label: "SLA Health", value: `${stats?.sla_compliance || 100}%`, icon: History, color: "text-muted", unit: "ACCURACY" }
                         ].map((card, idx) => (
                          <div key={idx} className="bg-[#111114] border border-subtle p-6 rounded-2xl space-y-4 hover:border-white/10 transition-colors">
                              <card.icon className={card.color} size={20} />
                              <div>
                                 <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-1">{card.label}</p>
                                 <div className="text-2xl font-black tracking-tighter text-white font-mono">{card.value}</div>
                                 <p className="text-[9px] text-[#3e3e44] font-bold mt-1 tracking-tighter italic">{card.unit}_TRIAGED_AUTO</p>
                              </div>
                          </div>
                         ))}
                      </div>

                      <div className="bg-gradient-to-r from-brand-primary/10 to-transparent border border-brand-primary/20 p-10 rounded-3xl flex items-center justify-between shadow-2xl relative overflow-hidden group">
                         <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <div className="flex items-center gap-8 relative z-10">
                            <div className="w-20 h-20 rounded-2xl bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30 text-brand-primary shadow-[0_0_50px_rgb(37,99,235,0.1)]">
                               <Shield size={40} />
                            </div>
                            <div>
                               <h3 className="text-lg font-black uppercase tracking-widest text-white italic mb-1">Governance AI Scorecard</h3>
                               <p className="text-xs text-muted font-bold max-w-sm leading-relaxed">ALL NODES ARE ROUTED THROUGH AUTO-GOVERNANCE ENGINE (RULE 1). RISK SHIELD ACTIVE AT 80% SENSITIVITY.</p>
                            </div>
                         </div>
                         <button className="relative z-10 text-[10px] bg-white text-black font-black px-10 py-4 rounded-xl uppercase tracking-widest shadow-2xl hover:bg-brand-primary hover:text-white transition-all active:scale-95">Download Audit Logs</button>
                      </div>
                   </div>
                )}

                {/* --- CONNECTORS VIEW --- */}
                {activeSubTab === "connectors" && (
                   <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div>
                        <h2 className="text-3xl font-black tracking-tighter uppercase italic text-white mb-2 underline decoration-brand-primary decoration-4 underline-offset-8">Node_Connectivity</h2>
                        <p className="text-[11px] text-muted font-bold tracking-[0.2em] uppercase">PIPELINE: INBOUND_EMAIL_TO_OUTBOUND_TRIAGE</p>
                      </div>

                      <div className="bg-[#111114] border border-subtle rounded-3xl overflow-hidden shadow-2xl">
                         <div className="px-10 py-6 bg-white/5 border-b border-subtle flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="p-2 bg-brand-primary/10 rounded-lg border border-brand-primary/20">
                                  <Mail className="text-brand-primary" size={18} />
                               </div>
                               <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white italic">IMAP_S Governance Link</span>
                            </div>
                            <span className="text-[9px] font-black text-muted uppercase bg-black/40 px-3 py-1 rounded-full border border-subtle tracking-widest">Rule 1 Enforcement</span>
                         </div>
                         <div className="p-12 space-y-10">
                            <div className="grid grid-cols-2 gap-10">
                               <div className="space-y-3">
                                  <label className="text-[10px] text-muted font-black uppercase tracking-[0.2em] ml-2">Integration Target (Host)</label>
                                  <input 
                                    value={imap.host} 
                                    onChange={(e) => setImap({...imap, host: e.target.value})}
                                    className="w-full bg-[#0d1117] border border-subtle rounded-2xl px-6 py-4 text-sm font-mono text-white outline-none focus:border-brand-primary transition-all placeholder:text-[#333]"
                                    placeholder="imap.corp-it.com"
                                  />
                               </div>
                               <div className="space-y-3">
                                  <label className="text-[10px] text-muted font-black uppercase tracking-[0.2em] ml-2">Service Identity (User)</label>
                                  <input 
                                    value={imap.user} 
                                    onChange={(e) => setImap({...imap, user: e.target.value})}
                                    className="w-full bg-[#0d1117] border border-subtle rounded-2xl px-6 py-4 text-sm font-mono text-white outline-none focus:border-brand-primary transition-all placeholder:text-[#333]"
                                    placeholder="sentinel@corp.it"
                                  />
                               </div>
                            </div>
                            <div className="space-y-3 relative">
                               <label className="text-[10px] text-muted font-black uppercase tracking-[0.2em] ml-2">Handshake Secret (Rule 3 Pass)</label>
                               <input 
                                 type="password"
                                 value={imap.pass} 
                                 onChange={(e) => setImap({...imap, pass: e.target.value})}
                                 className="w-full bg-[#0d1117] border border-subtle rounded-2xl px-6 py-4 text-sm font-mono text-white outline-none focus:border-brand-primary transition-all pr-12 placeholder:text-[#333]"
                                 placeholder="•••• •••• •••• ••••"
                               />
                               <Lock className="absolute right-6 bottom-4 text-white/10" size={20} />
                            </div>
                            <button 
                              onClick={handleSaveIntegration}
                              disabled={loading}
                              className="w-full group relative overflow-hidden bg-brand-primary hover:bg-brand-primary/80 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-[#0b0e14] transition-all shadow-[0_20px_40px_rgba(37,99,235,0.15)] active:scale-[0.98] disabled:opacity-50"
                            >
                               <div className="flex items-center justify-center gap-3">
                                 {loading ? "INITIALIZING_CLEAN_PIPE..." : "Establish Gateway Connection"} <ArrowRight size={16} />
                               </div>
                            </button>
                         </div>
                      </div>

                      <div className="bg-[#111114]/30 border border-subtle border-dashed p-10 rounded-3xl opacity-20 pointer-events-none filter grayscale">
                         <div className="flex items-center justify-between mb-2">
                           <h3 className="text-xs font-black uppercase tracking-widest text-muted italic">Outbound Destination (Rule 2: Webhooks)</h3>
                           <span className="text-[9px] font-black text-brand-danger bg-brand-danger/10 px-3 py-1 rounded-full border border-brand-danger/20">AWAITING_LICENSE_SYNC</span>
                         </div>
                         <p className="text-[10px] text-muted font-bold uppercase tracking-tight italic">ENFORCE_ZENDESK_PROTOCOL is currently locked by System Administrator. Verify your Enterprise License Node to continue.</p>
                      </div>
                   </div>
                )}

                {/* --- RISK RULES VIEW --- */}
                {activeSubTab === "rules" && (
                   <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div>
                        <h2 className="text-3xl font-black tracking-tighter uppercase italic text-white mb-2 underline decoration-brand-primary decoration-4 underline-offset-8">Defensive_Posture</h2>
                        <p className="text-[11px] text-muted font-bold tracking-[0.2em] uppercase">ENGINE: ADVERSARIAL_NEURAL_SENTRY_V2</p>
                      </div>

                      <div className="bg-[#111114] border border-subtle rounded-3xl p-12 space-y-16">
                         <div className="space-y-8">
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                  <div className="p-2 bg-brand-primary/10 rounded-xl border border-brand-primary/30">
                                    <Sliders className="text-brand-primary" size={20} />
                                  </div>
                                  <div>
                                     <h4 className="text-xs font-black uppercase tracking-widest text-white italic">Intelligence Floor</h4>
                                     <p className="text-[9px] text-muted font-bold">MINIMUM_CONFIDENCE_THRESHOLD</p>
                                  </div>
                               </div>
                               <span className="text-2xl font-black text-brand-primary font-mono bg-brand-primary/5 px-4 py-1 rounded-xl border border-brand-primary/10">{sensitivity}%</span>
                            </div>
                            <div className="relative group">
                               <div className="absolute -inset-1 bg-brand-primary/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                               <input 
                                 type="range"
                                 min="0"
                                 max="100"
                                 value={sensitivity}
                                 onChange={(e) => setSensitivity(parseInt(e.target.value))}
                                 className="relative w-full h-2 bg-[#0d1117] rounded-full appearance-none cursor-pointer accent-brand-primary"
                               />
                            </div>
                            <div className="flex justify-between text-[9px] font-black uppercase text-[#3e3e44] tracking-widest italic">
                               <span>High_Throughput (Permissive)</span>
                               <span>Maximum_Friction (Strict)</span>
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-8">
                            {[
                               { label: "Adversarial Prompt Guard", desc: "Instantly flags prompt injection attempts in triage logic.", active: true },
                               { label: "PII Exfiltration Sentry", desc: "Intercepts AWS/OpenAI keys or bank data in emails.", active: true },
                               { label: "LLM Consistency Audit", desc: "Cross-checks reasoning traces for decision stability.", active: false },
                               { label: "GDPR Compliance Filter", desc: "Escalates personal data requests to Legal Node.", active: true }
                            ].map((rule, idx) => (
                               <div key={idx} className={`p-8 border rounded-3xl transition-all group hover:scale-[1.02] ${rule.active ? 'bg-brand-primary/5 border-brand-primary/30' : 'bg-black/10 border-subtle opacity-30 grayscale'}`}>
                                  <div className="flex items-center justify-between mb-4">
                                     <h5 className="text-[11px] font-black uppercase text-white tracking-[0.15em] italic">{rule.label}</h5>
                                     <div className={`w-3 h-3 rounded-full ${rule.active ? 'bg-brand-success shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-[#333]'} `}></div>
                                  </div>
                                  <p className="text-[10px] text-muted font-bold tracking-tight leading-relaxed">{rule.desc}</p>
                                  {rule.active && <div className="mt-4 text-[8px] font-black text-brand-primary uppercase tracking-[0.2em] italic">Operational_v2</div>}
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                )}

                {/* --- IAM VIEW --- */}
                {activeSubTab === "iam" && (
                   <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div>
                        <h2 className="text-3xl font-black tracking-tighter uppercase italic text-white mb-2 underline decoration-brand-primary decoration-4 underline-offset-8">Access_Governance</h2>
                        <p className="text-[11px] text-muted font-bold tracking-[0.2em] uppercase">POLICY: ROLE_BASED_ACCESS_CONTROL (RBAC)</p>
                      </div>

                      <div className="bg-[#111114] border border-brand-primary/10 rounded-3xl p-12 relative overflow-hidden group shadow-2xl">
                         <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-primary/10 transition-colors"></div>
                         <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#5c5c64] mb-10 flex items-center gap-4">
                            <div className="p-2 bg-brand-primary/10 rounded-xl">
                               <UserPlus size={18} className="text-brand-primary" />
                            </div>
                            Provision New Triage Identity
                         </h3>
                         
                         <div className="grid grid-cols-4 gap-8 relative z-10">
                            <div className="col-span-1 space-y-3">
                              <span className="text-[10px] font-black text-muted uppercase ml-2 tracking-widest">Operator UID</span>
                              <input 
                                value={newMember.username}
                                onChange={(e) => setNewMember({...newMember, username: e.target.value})}
                                className="w-full bg-[#0d1117] border border-subtle rounded-2xl px-6 py-4 text-sm font-mono text-white outline-none focus:border-brand-primary transition-all placeholder:text-[#333]" 
                                placeholder="NODE_ALPHA_01"
                              />
                            </div>
                            <div className="col-span-1 space-y-3">
                              <span className="text-[10px] font-black text-muted uppercase ml-2 tracking-widest">Sentinel Token</span>
                              <input 
                                type="password"
                                value={newMember.password}
                                onChange={(e) => setNewMember({...newMember, password: e.target.value})}
                                className="w-full bg-[#0d1117] border border-subtle rounded-2xl px-6 py-4 text-sm font-mono text-white outline-none focus:border-brand-primary transition-all placeholder:text-[#333]" 
                                placeholder="••••••••"
                              />
                            </div>
                            <div className="col-span-1 space-y-3">
                              <span className="text-[10px] font-black text-muted uppercase ml-2 tracking-widest">Permission Scope</span>
                              <div className="relative">
                                <select 
                                  value={newMember.role}
                                  onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                                  className="w-full bg-[#0d1117] border border-subtle rounded-2xl px-6 py-4 text-xs font-black text-muted outline-none appearance-none cursor-pointer uppercase tracking-[0.2em] transition-all hover:border-brand-primary"
                                >
                                   <option value="analyst">Operator_Analyst</option>
                                   <option value="admin">Global_Sentry_Admin</option>
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 italic text-[10px]">▼</div>
                              </div>
                            </div>
                            <div className="col-span-1 flex items-end">
                              <button 
                                onClick={handleAddMember}
                                className="w-full px-8 py-4 bg-white hover:bg-brand-primary text-black hover:text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-2xl active:scale-95"
                              >
                                Commit to Registry
                              </button>
                            </div>
                         </div>
                      </div>

                      <div className="bg-[#111114] border border-subtle rounded-3xl overflow-hidden shadow-2xl">
                         <table className="w-full text-left">
                            <thead>
                              <tr className="bg-white/5 border-b border-subtle text-[#4a4a52] text-[10px] font-black uppercase tracking-[0.3em] font-sans">
                                 <th className="px-10 py-7">OPERATOR_IDENTITY</th>
                                 <th className="px-10 py-7 text-center">PERMISSION_TAG</th>
                                 <th className="px-10 py-7 text-right">NODE_STATUS</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                               {members.map((u: any) => (
                                 <tr key={u.uid} className="hover:bg-white/5 transition-all group">
                                    <td className="px-10 py-7">
                                       <div className="flex items-center gap-5">
                                          <div className="w-12 h-12 bg-[#0d1117] rounded-2xl flex items-center justify-center border border-subtle group-hover:border-brand-primary/30 group-hover:bg-brand-primary/5 transition-all">
                                             <Users size={20} className="text-muted group-hover:text-brand-primary transition-colors" />
                                          </div>
                                          <div className="flex flex-col">
                                             <span className="text-[13px] font-black tracking-tight uppercase text-white group-hover:text-brand-primary transition-colors">{u.username}</span>
                                             <span className="text-[9px] font-mono text-muted uppercase tracking-tighter">UID_NODE: {u.uid.slice(0,8)}...</span>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-10 py-7 text-center">
                                       <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] italic border border-brand-primary/30 bg-brand-primary/5 px-4 py-1.5 rounded-full shadow-inner">{u.role}</span>
                                    </td>
                                    <td className="px-10 py-7 text-right">
                                       <div className="inline-flex items-center gap-3 px-4 py-2 bg-brand-success/10 border border-brand-success/30 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                          <div className="w-2 h-2 rounded-full bg-brand-success animate-pulse"></div>
                                          <span className="text-[10px] font-black text-brand-success uppercase tracking-widest italic">Authorized_Operational</span>
                                       </div>
                                    </td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                )}

             </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        :root {
          --bg-main: #0b0e14;
          --bg-sidebar: #010409;
          --border-subtle: rgba(255,255,255,0.08);
          --brand-primary: #2563eb;
          --brand-success: #10b981;
          --brand-warning: #f59e0b;
          --brand-danger: #ef4444;
          --muted: #8b949e;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        input[type=range]::-webkit-slider-runnable-track {
          background: #0d1117;
          height: 8px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        
        input[type=range]::-webkit-slider-thumb {
          margin-top: -6px;
        }
      `}</style>
    </div>
  );
}
