"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { 
  Shield, 
  Clock, 
  Send, 
  AlertCircle, 
  History, 
  ArrowRight, 
  CheckCircle2, 
  Terminal,
  ChevronRight,
  User,
  Activity,
  BookOpen,
  LayoutDashboard,
  Settings,
  Bell,
  Target,
  FlaskConical,
  Flag
} from "lucide-react";

type Action = {
  verb: "set_category" | "set_priority" | "set_response" | "submit" | "escalate" | "noop";
  category?: string;
  priority?: number;
  response_draft?: string;
  escalate_to?: "L2" | "L3" | null;
};

type Observation = {
  ticket_id: string;
  difficulty: "easy" | "medium" | "hard";
  ticket_body: string;
  policy_hint: string;
  category_guess: string | null;
  priority_guess: number | null;
  response_draft: string | null;
  escalated_to: string | null;
  sla_remaining_steps: number;
  reward_model: any;
  kb_results: string[];
  feedback: string;
  step_index: number;
  max_steps: number;
  customer_tier: string;
  escalated: boolean;
};

type StepResult = {
  observation: Observation;
  reward: number;
  done: boolean;
  info: any;
};

export default function Home() {
  const [taskKey, setTaskKey] = useState<string | null>(null);
  const [obs, setObs] = useState<Observation | null>(null);
  const [reward, setReward] = useState<number>(0);
  const [totalReward, setTotalReward] = useState<number>(0);
  const [isDone, setIsDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState(0);
  const [history, setHistory] = useState<any[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<number>(3);
  const [responseDraft, setResponseDraft] = useState<string>("");
  const [escalateTo, setEscalateTo] = useState<string>("");

  const resetTask = async (key: string) => {
    setLoading(true);
    setHistory([]);
    try {
      const resp = await fetch("/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_key: key }),
      });
      const data = await resp.json();
      setObs(data);
      setTaskKey(key);
      setReward(0);
      setTotalReward(0);
      setIsDone(false);
      setSteps(0);
      
      if (data.category_guess) setSelectedCategory(data.category_guess);
      if (data.priority_guess) setSelectedPriority(data.priority_guess);
      if (data.response_draft) setResponseDraft(data.response_draft);
      if (data.escalated_to) setEscalateTo(data.escalated_to);
    } catch (err) {
      console.error("Failed to reset task:", err);
    } finally {
      setLoading(false);
    }
  };

  const takeStep = async (verb: Action["verb"]) => {
    if (!taskKey || loading || isDone) return;
    setLoading(true);
    
    const action: Action = { verb };
    if (verb === "set_category") action.category = selectedCategory;
    if (verb === "set_priority") action.priority = selectedPriority;
    if (verb === "set_response") action.response_draft = responseDraft;
    if (verb === "escalate") action.escalate_to = (escalateTo as "L2" | "L3") || null;

    try {
      const resp = await fetch("/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data: StepResult = await resp.json();
      setObs(data.observation);
      setReward(data.reward);
      setTotalReward(prev => prev + data.reward);
      setIsDone(data.done);
      setSteps(prev => prev + 1);
      setHistory(prev => [...prev, { action, reward: data.reward }]);

      if (data.observation.category_guess) setSelectedCategory(data.observation.category_guess);
      if (data.observation.priority_guess) setSelectedPriority(data.observation.priority_guess);
      if (data.observation.response_draft) setResponseDraft(data.observation.response_draft);
      if (data.observation.escalated_to) setEscalateTo(data.observation.escalated_to);

    } catch (err) {
      console.error("Failed to take step:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)]">
      <Sidebar />
      
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="console-header">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <LayoutDashboard size={14} /> Triage Hub <ChevronRight size={12} /> 
            <span className="text-white">{obs?.ticket_id || "Awaiting Task"}</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded border border-subtle">
              <FlaskConical size={14} className="text-zinc-500" />
              <span className="text-[10px] font-bold uppercase text-zinc-400">Environment: Support_Demo</span>
            </div>
            <button className="text-muted hover:text-white transition-colors">
              <Bell size={18} />
            </button>
            <button className="text-muted hover:text-white transition-colors">
              <Settings size={18} />
            </button>
          </div>
        </header>

        <div className="p-6">
          {!taskKey ? (
            <div className="max-w-4xl mx-auto py-12">
              <h1 className="text-2xl font-bold mb-2">Triage Hub Console</h1>
              <p className="text-muted text-sm mb-8">Select a simulated ticket scenario to begin the evaluation environment.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: "easy_billing", name: "Billing Inquiry", diff: "easy", icon: Shield, desc: "Simple routing for duplicate invoice charges." },
                  { id: "medium_infra", name: "Infra Outage", diff: "medium", icon: Activity, desc: "Production Postgres cluster downtime." },
                  { id: "hard_security", name: "VPN Breach", diff: "hard", icon: AlertCircle, desc: "Impossible travel login detected." },
                  { id: "hard_privacy", name: "GDPR RTBF", diff: "hard", icon: Shield, desc: "Data deletion request with CC-leak risk." },
                ].map((t) => (
                  <div key={t.id} className="console-card p-5 group hover:border-brand-primary transition-all cursor-pointer" onClick={() => resetTask(t.id)}>
                    <div className="w-10 h-10 bg-white/5 rounded-md flex items-center justify-center mb-4 text-zinc-400 group-hover:text-brand-primary transition-colors">
                      <t.icon size={20} />
                    </div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm tracking-tight">{t.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${
                        t.diff === "easy" ? "border-green-500/20 text-green-400" : 
                        t.diff === "medium" ? "border-yellow-500/20 text-yellow-400" : 
                        "border-red-500/20 text-red-400"
                      }`}>{t.diff.toUpperCase()}</span>
                    </div>
                    <p className="text-[11px] text-muted mb-4 leading-normal">{t.desc}</p>
                    <button className="console-btn-secondary w-full group-hover:bg-brand-primary group-hover:border-brand-primary text-[10px] py-1">LAUNCH SIMULATION</button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-6 items-start fade-in">
              
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <section className="console-card overflow-hidden">
                  <div className="bg-white/5 px-4 py-2 border-b border-subtle flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-wider">
                      <Flag size={14} /> Ticket ID: {obs?.ticket_id}
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-1.5">
                        <User size={12} className="text-zinc-500" />
                        <span className="text-[10px] font-medium text-zinc-300">{obs?.customer_tier?.toUpperCase()} TIER</span>
                      </div>
                      <button className="console-btn-secondary py-0.5 px-2 text-[10px] opacity-60 hover:opacity-100" onClick={() => setTaskKey(null)}>EXIT SESSION</button>
                    </div>
                  </div>
                  <div className="p-6">
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-300 bg-black/20 p-4 rounded border border-subtle">
                      {obs?.ticket_body}
                    </pre>
                  </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="console-card p-4 space-y-4">
                    <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                       <Target size={14} className="text-brand-primary" /> Routing Classification
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                        className="bg-zinc-800 border border-subtle text-xs rounded px-2 py-1.5 focus:border-brand-primary outline-none"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <option value="">-- Main Queue --</option>
                        <option value="billing">Billing</option>
                        <option value="access">Access Control</option>
                        <option value="infrastructure">Infrastructure</option>
                        <option value="security">Security Ops</option>
                      </select>
                      <button className="console-btn-primary" onClick={() => takeStep("set_category")} disabled={loading || isDone}>Set Queue</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                        className="bg-zinc-800 border border-subtle text-xs rounded px-2 py-1.5 focus:border-brand-primary outline-none"
                        value={selectedPriority}
                        onChange={(e) => setSelectedPriority(Number(e.target.value))}
                      >
                        {[1, 2, 3, 4].map(p => <option key={p} value={p}>P{p} Urgency</option>)}
                      </select>
                      <button className="console-btn-primary" onClick={() => takeStep("set_priority")} disabled={loading || isDone}>Set Priority</button>
                    </div>
                  </div>

                  <div className="console-card p-4 space-y-4">
                    <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                       <ArrowRight size={14} className="text-brand-warning" /> Expert Escalation
                    </h3>
                    <div className="flex gap-2">
                      <select 
                        className="flex-1 bg-zinc-800 border border-subtle text-xs rounded px-2 py-1.5 focus:border-brand-primary outline-none"
                        value={escalateTo}
                        onChange={(e) => setEscalateTo(e.target.value)}
                      >
                        <option value="">-- Target Level --</option>
                        <option value="L2">L2: Management</option>
                        <option value="L3">L3: Legal/Expert</option>
                      </select>
                      <button className="console-btn-secondary border-brand-warning/30 text-brand-warning hover:bg-brand-warning/5" onClick={() => takeStep("escalate")} disabled={loading || isDone || obs?.escalated}>
                        {obs?.escalated ? "ACTIVE" : "Escalate"}
                      </button>
                    </div>
                    {obs?.escalated && (
                      <div className="p-2 bg-brand-warning/10 border border-brand-warning/20 rounded text-[10px] text-brand-warning font-mono">
                        ESCALATED TO {obs?.escalated_to}
                      </div>
                    )}
                  </div>
                </section>

                <section className="console-card p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                       <Send size={14} className="text-brand-success" /> Response Draft Terminal
                    </h3>
                    <div className="flex items-center gap-2">
                       <button className="console-btn-secondary py-1 text-[10px]" onClick={() => takeStep("set_response")} disabled={loading || isDone}>SAVE DRAFT</button>
                       <button className="console-btn-primary py-1 px-8 bg-brand-success hover:bg-green-600 text-[10px]" onClick={() => takeStep("submit")} disabled={loading || isDone}>COMMIT RESPONSE</button>
                    </div>
                  </div>
                  <textarea 
                    className="w-full bg-[#0b0e14] border border-subtle rounded p-4 text-[11px] font-mono text-zinc-300 min-h-[160px] focus:border-brand-primary outline-none resize-y"
                    placeholder="Drafting professional transmission..."
                    value={responseDraft}
                    onChange={(e) => setResponseDraft(e.target.value)}
                  />
                  {obs?.feedback && (
                    <div className="flex gap-3 items-start bg-black/30 p-4 rounded border border-subtle">
                      <Terminal size={14} className="mt-0.5 text-zinc-500" />
                      <div className="flex-1 text-[11px] font-mono text-zinc-400">
                        <span className="text-brand-primary font-bold">system:~/triage$</span> {obs.feedback}
                      </div>
                    </div>
                  )}
                </section>
              </div>

              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="console-card p-3">
                    <p className="text-[10px] text-muted font-bold uppercase mb-1">Total Reward</p>
                    <p className={`text-xl font-bold font-mono tracking-tight ${totalReward >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                      {totalReward.toFixed(3)}
                    </p>
                  </div>
                  <div className="console-card p-3">
                    <p className="text-[10px] text-muted font-bold uppercase mb-1">SLA Budget</p>
                    <div className="flex items-baseline gap-1">
                      <p className={`text-xl font-bold font-mono ${obs?.sla_remaining_steps && obs.sla_remaining_steps < 3 ? 'text-brand-danger' : 'text-white'}`}>
                        {obs?.sla_remaining_steps}
                      </p>
                      <span className="font-mono text-[10px] text-muted">/ {obs?.max_steps}</span>
                    </div>
                  </div>
                </div>

                <section className="console-card">
                  <div className="bg-white/5 px-4 py-2 border-b border-subtle text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                    <Shield size={14} /> Corporate Policy
                  </div>
                  <div className="p-4 text-[11px] text-zinc-400 bg-black/20 font-mono leading-relaxed max-h-[200px] overflow-y-auto custom-scrollbar italic border-brand-primary/10 border-l-2">
                    {obs?.policy_hint}
                  </div>
                </section>

                {obs?.kb_results && obs.kb_results.length > 0 && (
                  <section className="console-card border-brand-primary/30">
                    <div className="bg-brand-primary/10 px-4 py-2 border-b border-brand-primary/30 text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
                      <BookOpen size={14} /> Knowledge Core (RAG)
                    </div>
                    <div className="p-4 space-y-3">
                      {obs.kb_results.map((kb, i) => (
                        <div key={i} className="text-[10px] text-blue-200/80 font-mono bg-blue-500/5 p-3 rounded border border-blue-500/10 whitespace-pre-wrap">
                          {kb}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section className="console-card">
                  <div className="bg-white/5 px-4 py-2 border-b border-subtle text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                    <History size={14} /> Session History
                  </div>
                  <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {history.map((h, i) => (
                      <div key={i} className="flex gap-3 items-center text-[10px] font-mono border-b border-subtle pb-2 last:border-0 border-dashed">
                        <span className="text-zinc-600">[{i+1}]</span>
                        <span className="flex-1 text-zinc-400">{h.action.verb.toUpperCase()}</span>
                        <span className={h.reward >= 0 ? 'text-brand-success' : 'text-brand-danger'}>
                          {h.reward >= 0 ? '+' : ''}{h.reward.toFixed(3)}
                        </span>
                      </div>
                    ))}
                    {history.length === 0 && <p className="text-zinc-600 text-[10px] italic">Idle state.</p>}
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 2px; }
        .fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
