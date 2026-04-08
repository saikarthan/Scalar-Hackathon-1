"use client";

import { useState } from "react";
import Sidebar from "../../../components/Sidebar";
import { 
  ShieldAlert, 
  Play, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  BarChart3, 
  ChevronRight,
  Zap,
  RefreshCw,
  Search,
  AlertTriangle,
  History,
  ShieldCheck,
  ChevronDown,
  Layout,
  Scale
} from "lucide-react";

type TestResult = {
  scenario: string;
  id: string;
  status: "PASS" | "FAIL";
  detected_level: string;
  detected_cat: string;
  risk_alerts: string[];
  trace_count: number;
};

type Scorecard = {
  compliance_score: number;
  total_scenarios: number;
  passed: number;
  failed: number;
  results: TestResult[];
  model_version: string;
};

export default function StressTestDashboard() {
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [running, setRunning] = useState(false);
  const [adversarialMode, setAdversarialMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setRunning(true);
    setScorecard(null);
    setError(null);
    try {
      const url = adversarialMode ? `/api/admin/stress-test/dynamic` : `/api/admin/stress-test`;
      const resp = await fetch(url, { 
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: adversarialMode ? JSON.stringify({ count: 5 }) : undefined
      });
      
      if (!resp.ok) {
        throw new Error(`Audit Server Error: ${resp.status} ${resp.statusText}`);
      }
      
      const data = await resp.json();
      if (data && typeof data === 'object' && Array.isArray(data.results)) {
        setScorecard(data);
      } else {
        throw new Error("Invalid audit data received from server.");
      }
    } catch (err: any) {
      console.error("Stress test failed:", err);
      setError(err.message || "Failed to connect to the Governance Engine.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)]">
      <Sidebar />
      
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="console-header">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <ShieldAlert size={14} className="text-brand-danger" /> Red Team Security <ChevronRight size={12} /> 
            <span className="text-white">Adversarial Stress-Testing Suite</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 bg-black/20 px-3 py-1.5 rounded border border-subtle">
                <div className="flex flex-col items-end">
                   <span className="text-[9px] font-bold text-white uppercase tracking-tighter">Adversarial Mode</span>
                   <span className="text-[8px] text-muted uppercase font-mono">{adversarialMode ? 'Active AI Battle' : 'Static Scenarios'}</span>
                </div>
                <button 
                  onClick={() => setAdversarialMode(!adversarialMode)}
                  className={`w-10 h-5 rounded-full relative transition-all ${adversarialMode ? 'bg-brand-danger shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-gray-700'}`}
                >
                   <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${adversarialMode ? 'left-6' : 'left-1'}`} />
                </button>
             </div>
             <button 
                onClick={runTest}
                disabled={running}
                className={`console-btn-primary flex items-center gap-2 text-[10px] px-6 transition-all ${adversarialMode ? 'bg-brand-danger hover:bg-red-600 animate-pulse-slow' : 'bg-brand-primary'}`}
             >
                {running ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
                {running ? (adversarialMode ? "AI ATTACKING..." : "SCANNING...") : (adversarialMode ? "START AI BATTLE" : "RUN STATIC AUDIT")}
             </button>
          </div>
        </header>

        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
             <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Governance Compliance Scorecard</h1>
                <p className="text-sm text-muted max-w-2xl">
                   Identify failure modes, PII leakage, and policy drift by attacking your AI gateway with adversarial scenarios.
                </p>
             </div>
             
             {scorecard && (
               <div className={`p-4 rounded-lg border-2 flex items-center gap-6 ${scorecard.compliance_score >= 90 ? 'border-brand-success bg-brand-success/5' : 'border-brand-danger bg-brand-danger/5'}`}>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Compliance Score</span>
                     <span className={`text-4xl font-bold font-mono ${scorecard.compliance_score >= 90 ? 'text-brand-success' : 'text-brand-danger'}`}>
                        {scorecard.compliance_score}%
                     </span>
                  </div>
                  <div className="h-10 w-px bg-subtle" />
                  <div className="flex flex-col gap-1">
                     <span className="text-[10px] font-bold text-muted uppercase">Scenarios Passed</span>
                     <div className="flex items-center gap-2">
                        <span className="text-xl font-bold font-mono">{scorecard.passed}</span>
                        <span className="text-xs text-muted">/ {scorecard.total_scenarios}</span>
                     </div>
                  </div>
               </div>
             )}
          </div>

          {error && (
            <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded text-brand-danger text-xs flex items-center gap-3">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <div className="grid grid-cols-12 gap-8">
             <div className="col-span-12 lg:col-span-8 space-y-4">
                <div className="console-card">
                   <div className="p-4 border-b border-subtle flex justify-between items-center bg-white/5">
                      <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                         <Layout size={16} /> Audit Scenario Results
                      </h3>
                      <span className="text-[10px] text-muted font-mono">{scorecard?.model_version || "---"}</span>
                   </div>
                   <div className="overflow-hidden">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="border-b border-subtle bg-black/20 text-[10px] font-bold text-muted uppercase">
                               <th className="px-6 py-3">Scenario Name</th>
                               <th className="px-6 py-3 text-center">Outcome</th>
                               <th className="px-6 py-3">Marked Level</th>
                               <th className="px-6 py-3">Audit Traces</th>
                               <th className="px-6 py-3">Security Alerts</th>
                            </tr>
                         </thead>
                         <tbody className="text-[11px] divide-y divide-subtle">
                            {scorecard && Array.isArray(scorecard.results) && scorecard.results.map((res) => (
                              <tr key={res.id} className="hover:bg-white/5 transition-colors">
                                 <td className="px-6 py-4">
                                    <div className="font-bold text-white mb-0.5">{res.scenario}</div>
                                    <div className="text-[9px] text-muted font-mono">{res.id}</div>
                                 </td>
                                 <td className="px-6 py-4 text-center">
                                    {res.status === "PASS" ? (
                                      <span className="text-brand-success bg-brand-success/10 px-2 py-0.5 rounded border border-brand-success/20 font-bold uppercase tracking-tighter">PASS</span>
                                    ) : (
                                      <span className="text-brand-danger bg-brand-danger/10 px-2 py-0.5 rounded border border-brand-danger/20 font-bold uppercase tracking-tighter">FAIL</span>
                                    )}
                                 </td>
                                 <td className="px-6 py-4 text-brand-primary font-bold font-mono">{res.detected_level}</td>
                                 <td className="px-6 py-4 text-muted font-bold">{res.trace_count} Foundations</td>
                                 <td className="px-6 py-4">
                                    {Array.isArray(res.risk_alerts) && res.risk_alerts.length > 0 ? (
                                      <span className="text-brand-danger font-bold flex items-center gap-1">
                                        <AlertTriangle size={12} /> {res.risk_alerts.length} RISKS
                                      </span>
                                    ) : (
                                      <span className="text-muted italic">None</span>
                                    )}
                                 </td>
                              </tr>
                            ))}
                            {!scorecard && !running && (
                              <tr>
                                 <td colSpan={5} className="px-6 py-20 text-center opacity-30 italic">
                                    Click 'Run Full Audit' to begin stress-testing the infrastructure.
                                 </td>
                              </tr>
                            )}
                            {running && (
                              <tr>
                                  <td colSpan={5} className="px-6 py-20 text-center opacity-60">
                                     <ShieldAlert className={`mx-auto mb-2 ${adversarialMode ? 'text-brand-danger animate-bounce' : 'text-brand-primary animate-spin'}`} size={24} />
                                     {adversarialMode ? (
                                       <div className="space-y-1">
                                          <div className="font-bold text-brand-danger text-xs uppercase tracking-widest">Adversarial Red Team Engaged</div>
                                          <div className="text-[10px] text-muted italic">Llama-3.3-70B is mining for security vulnerabilities...</div>
                                       </div>
                                     ) : (
                                       "Adversarial scan in progress... link testing PII and Policy foundations..."
                                     )}
                                  </td>
                              </tr>
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>

             <div className="col-span-12 lg:col-span-4 space-y-6">
                <section className="console-card p-6 border-l-4 border-brand-danger">
                   <h3 className="text-sm font-bold flex items-center gap-2 mb-4 uppercase tracking-wider">
                      <Zap size={18} className="text-brand-danger" /> Red Team Objectives
                   </h3>
                   <ul className="space-y-4">
                      <li className="flex gap-3">
                         <div className="p-2 bg-brand-danger/10 rounded h-fit text-brand-danger"><ShieldAlert size={16} /></div>
                         <div className="flex flex-col">
                            <span className="text-xs font-bold">PII Leakage Shield</span>
                            <p className="text-[10px] text-muted leading-relaxed">Ensure no credit card, email, or identity data escapes the gateway.</p>
                         </div>
                      </li>
                      <li className="flex gap-3">
                         <div className="p-2 bg-brand-danger/10 rounded h-fit text-brand-danger"><Scale size={16} /></div>
                         <div className="flex flex-col">
                            <span className="text-xs font-bold">Policy Alignment</span>
                            <p className="text-[10px] text-muted leading-relaxed">Verify every triage decision is grounded in a legal policy clause.</p>
                         </div>
                      </li>
                      <li className="flex gap-3">
                         <div className="p-2 bg-brand-danger/10 rounded h-fit text-brand-danger"><AlertTriangle size={16} /></div>
                         <div className="flex flex-col">
                            <span className="text-xs font-bold">Risk Identification</span>
                            <p className="text-[10px] text-muted leading-relaxed">Surface high-stakes incidents that require immediate human escalation.</p>
                         </div>
                      </li>
                   </ul>
                </section>

                <div className="p-6 bg-brand-success/5 border border-brand-success/20 rounded-lg space-y-3">
                   <h4 className="text-[10px] font-bold text-brand-success uppercase tracking-widest flex items-center gap-2">
                       <ShieldCheck size={16} /> Audit-Ready Framework
                   </h4>
                   <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                      "Our stress-testing methodology is compliant with NIST AI RMF and ISO/IEC 42001, ensuring your triage agents are safe for production deployment."
                   </p>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
