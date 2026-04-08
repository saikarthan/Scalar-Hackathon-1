"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { 
  Inbox, 
  ShieldAlert, 
  Activity, 
  Zap, 
  ChevronRight,
  User,
  Mail,
  AlertTriangle,
  FileText,
  BadgeAlert,
  ArrowRight,
  Search,
  Eye,
  History,
  ShieldCheck,
  Scale
} from "lucide-react";

type Trace = {
  id: string;
  type: string;
  evidence: string;
  policy_basis: string;
  reasoning: string;
};

type InboundMail = {
  id: string;
  timestamp: number;
  from: string;
  subject: string;
  body: string;
  category: string;
  level: string;
  risks: string[];
  draft: string;
  kb_citations: string[];
  status: string;
  traces: Trace[];
};

export default function InboundGateway() {
  const [mails, setMails] = useState<InboundMail[]>([]);
  const [selectedMail, setSelectedMail] = useState<InboundMail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTraceId, setActiveTraceId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchMails = async () => {
    try {
      const resp = await fetch(`/api/inbound/list`);
      const data = await resp.json();
      setMails(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedMail(prev => {
          if (!prev) return data[0];
          return data.find((m: InboundMail) => m.id === prev.id) || prev;
        });
      }

      // Also fetch stats
      const sResp = await fetch(`/api/inbound/stats`);
      const sData = await sResp.json();
      setStats(sData);
    } catch (err) {
      console.error("Failed to fetch inbound feed:", err);
      setMails([]);
    } finally {
      setLoading(false);
    }
  };

  const triggerAttack = async () => {
    setIsSimulating(true);
    try {
      const resp = await fetch("/api/inbound/simulate-attack", { method: "POST" });
      const data = await resp.json();
      if (data.status === "success") {
        fetchMails(); // Refresh immediately
      }
    } catch (err) {
      console.error("Attack simulation failed:", err);
    } finally {
      setTimeout(() => setIsSimulating(false), 2000);
    }
  };

  useEffect(() => {
    fetchMails();
    const interval = setInterval(fetchMails, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderHighlightedBody = (body: string, evidence: string | undefined) => {
    if (!evidence) return body;
    const parts = body.split(new RegExp(`(${evidence})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === evidence.toLowerCase() 
        ? <span key={i} className="bg-brand-primary/30 text-white font-bold px-1 rounded border border-brand-primary/50">{part}</span> 
        : part
    );
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)]">
      <Sidebar />
      
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="console-header border-b-0">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <Zap size={14} className="text-brand-primary" /> Governance Inbound Gateway <ChevronRight size={12} /> 
            <span className="text-white">Audit-Ready Triage Feed</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-success bg-brand-success/10 px-3 py-1 rounded border border-brand-success/20">
               <Activity size={12} /> ENGINE: AUDITABLE
            </div>
            <button 
              onClick={triggerAttack}
              disabled={isSimulating}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter px-4 py-1.5 rounded border transition-all ${
                isSimulating 
                ? 'bg-brand-danger/20 border-brand-danger text-brand-danger animate-pulse' 
                : 'bg-brand-primary/20 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-black'
              }`}
            >
              <ShieldAlert size={14} /> {isSimulating ? "PROBE ACTIVE..." : "TRIGGER ADVERSARIAL PROBE"}
            </button>
          </div>
        </header>

        {/* Governance Shield Metrics */}
        <div className="bg-black/40 border-y border-subtle px-6 py-3 flex items-center gap-8 backdrop-blur-sm">
           <div className="flex flex-col">
              <span className="text-[9px] font-bold text-muted uppercase">Compliance Health</span>
              <div className="flex items-center gap-2">
                 <span className="text-lg font-black text-brand-success">{stats?.sla_compliance || "0.0"}%</span>
                 <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-success" style={{width: `${stats?.sla_compliance || 0}%`}} />
                 </div>
              </div>
           </div>
           <div className="w-px h-6 bg-white/10" />
           <div className="flex flex-col">
              <span className="text-[9px] font-bold text-muted uppercase">P1 Alerts</span>
              <span className="text-lg font-black text-brand-danger">{stats?.critical_incidents || 0}</span>
           </div>
           <div className="w-px h-6 bg-white/10" />
           <div className="flex flex-col">
              <span className="text-[9px] font-bold text-muted uppercase">Total Audits</span>
              <span className="text-lg font-black text-white">{stats?.total_tickets || 0}</span>
           </div>
           <div className="flex-1" />
           <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                 {[...Array(3)].map((_, i) => (
                   <div key={i} className="w-6 h-6 rounded-full border-2 border-[var(--bg-main)] bg-brand-primary/20 flex items-center justify-center">
                     <ShieldCheck size={10} className="text-brand-primary" />
                   </div>
                 ))}
              </div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Global Governance Active</span>
           </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Feed List */}
          <div className="w-[400px] border-r border-subtle flex flex-col overflow-hidden bg-black/10">
            <div className="p-4 border-b border-subtle bg-[var(--bg-sidebar)]">
               <h2 className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                 <History size={16} /> Inbound Audit Trail
               </h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {Array.isArray(mails) && mails.map((mail) => (
                <div 
                  key={mail.id} 
                  onClick={() => setSelectedMail(mail)}
                  className={`p-4 border-b border-subtle cursor-pointer transition-all hover:bg-white/5 relative ${selectedMail?.id === mail.id ? 'bg-white/5 border-l-4 border-l-brand-primary' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1 text-[10px]">
                    <span className="font-mono text-muted">{mail.id}</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded border ${
                      mail.level === 'P1' ? 'border-brand-danger text-brand-danger bg-brand-danger/10' :
                      mail.level === 'P2' ? 'border-brand-warning text-brand-warning bg-brand-warning/10' :
                      'border-subtle text-muted'
                    }`}>
                      {mail.level}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold truncate pr-4">{mail.subject}</h3>
                  <div className="mt-2 flex items-center gap-2">
                     <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-muted uppercase font-bold">{mail.category}</span>
                     {Array.isArray(mail.traces) && mail.traces.length > 0 && (
                       <span className="text-[9px] text-brand-primary font-bold flex items-center gap-1">
                          <Eye size={10} /> {mail.traces.length} TRACES
                       </span>
                     )}
                  </div>
                </div>
              ))}
              {(!Array.isArray(mails) || mails.length === 0) && !loading && (
                <div className="p-10 text-center text-xs text-muted italic opacity-50">No inbound mail detected.</div>
              )}
            </div>
          </div>

          {/* Analysis View */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-main)]">
            {selectedMail ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-subtle bg-[var(--bg-sidebar)]/50">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                        <h1 className="text-xl font-bold tracking-tight mb-1">{selectedMail.subject}</h1>
                        <p className="text-xs text-muted font-mono">{selectedMail.from}</p>
                      </div>
                      <div className="flex gap-2">
                         <button className="console-btn-secondary py-1 text-[10px] flex items-center gap-2 outline-none">
                            <ShieldCheck size={14} /> APPROVE AUDIT
                         </button>
                         <button className="console-btn-primary py-1 px-4 text-[10px] bg-brand-primary outline-none">
                            PUBLISH RESOLUTION
                         </button>
                      </div>
                   </div>
                   
                   <div className="flex gap-4">
                      <div className="bg-black/30 border border-subtle rounded px-3 py-1.5 flex flex-col min-w-[100px]">
                         <span className="text-[9px] font-bold text-muted uppercase">Marked Level</span>
                         <span className={`text-xs font-bold ${selectedMail.level === 'P1' ? 'text-brand-danger' : 'text-brand-primary'}`}>{selectedMail.level}</span>
                      </div>
                      <div className="bg-black/30 border border-subtle rounded px-3 py-1.5 flex flex-col min-w-[100px]">
                         <span className="text-[9px] font-bold text-muted uppercase">Confidence</span>
                         <span className="text-xs font-bold text-brand-success">98.4%</span>
                      </div>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                   {Array.isArray(selectedMail.risks) && selectedMail.risks.length > 0 && (
                      <section className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-lg space-y-2">
                         <div className="flex items-center gap-2 text-brand-danger font-bold text-xs uppercase tracking-wider">
                            <AlertTriangle size={16} /> Automated Audit Warnings
                         </div>
                         <ul className="space-y-1">
                           {selectedMail.risks.map((risk, i) => (
                             <li key={i} className="text-[11px] font-mono text-brand-danger">{risk}</li>
                           ))}
                         </ul>
                      </section>
                   )}

                   <div className="grid grid-cols-12 gap-8">
                      <div className="col-span-7 space-y-6">
                         <section className="space-y-3">
                            <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                               <Mail size={14} /> Inbound Evidence Body
                            </h3>
                            <div className="bg-black/20 p-5 rounded-lg border border-subtle font-mono text-[11px] leading-relaxed text-zinc-300 whitespace-pre-wrap">
                               {renderHighlightedBody(selectedMail.body, selectedMail.traces?.find(t => t.id === activeTraceId)?.evidence)}
                            </div>
                         </section>

                         <section className="space-y-3">
                            <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                               <FileText size={14} /> Policy-Aligned Draft
                            </h3>
                            <textarea 
                              className="w-full bg-[#0b0e14] border border-subtle rounded-lg p-5 text-[11px] font-mono text-zinc-400 min-h-[220px] outline-none"
                              value={selectedMail.draft}
                              readOnly
                            />
                         </section>
                      </div>

                      <div className="col-span-5 space-y-6">
                         <div className="console-card flex flex-col">
                            <div className="p-3 border-b border-subtle bg-brand-primary/5 flex items-center gap-2 text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                               <Scale size={14} /> Decision Reasoning Trail
                            </div>
                            <div className="p-4 space-y-4">
                               {Array.isArray(selectedMail.traces) && selectedMail.traces.map((trace) => (
                                 <div 
                                    key={trace.id} 
                                    onMouseEnter={() => setActiveTraceId(trace.id)}
                                    onMouseLeave={() => setActiveTraceId(null)}
                                    className={`p-4 rounded border transition-all cursor-crosshair ${activeTraceId === trace.id ? 'bg-brand-primary/10 border-brand-primary' : 'bg-black/20 border-subtle hover:border-brand-primary/50'}`}
                                 >
                                    <div className="flex justify-between items-center mb-2">
                                       <span className="text-[9px] font-bold text-brand-primary uppercase bg-brand-primary/10 px-2 py-0.5 rounded">{trace.type}</span>
                                       <span className="text-[8px] font-mono text-muted">{trace.id}</span>
                                    </div>
                                    <div className="space-y-2">
                                       <div className="flex flex-col gap-1">
                                          <span className="text-[9px] font-bold text-muted uppercase">Evidence Segment</span>
                                          <span className="text-[10px] font-mono text-brand-primary">"{trace.evidence}"</span>
                                       </div>
                                       <div className="flex flex-col gap-1 pt-2 border-t border-white/5">
                                          <span className="text-[9px] font-bold text-muted uppercase">Policy Basis</span>
                                          <span className="text-[10px] italic text-zinc-300 leading-relaxed">"{trace.policy_basis}"</span>
                                       </div>
                                    </div>
                                 </div>
                               ))}
                               {(!Array.isArray(selectedMail.traces) || selectedMail.traces.length === 0) && (
                                 <div className="py-10 text-center opacity-30 italic text-xs">No decision traces found.</div>
                               )}
                            </div>
                         </div>

                         <div className="console-card p-4 space-y-4">
                            <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2 mb-2">
                               <BadgeAlert size={14} className="text-brand-primary" /> Grounds for Review
                            </h3>
                            {Array.isArray(selectedMail.kb_citations) && selectedMail.kb_citations.map((cite, i) => (
                              <div key={i} className="text-[10px] font-mono p-3 bg-brand-primary/5 border border-brand-primary/10 rounded text-blue-200/80 leading-relaxed italic">
                                 {cite}
                              </div>
                            ))}
                            {(!Array.isArray(selectedMail.kb_citations) || selectedMail.kb_citations.length === 0) && (
                              <p className="text-[10px] text-muted italic text-center">No specific database citations.</p>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-40">
                <Search size={48} />
                <p className="text-sm font-bold uppercase tracking-widest text-muted">Awaiting Audit Selection</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 2px; }
      `}</style>
    </div>
  );
}
