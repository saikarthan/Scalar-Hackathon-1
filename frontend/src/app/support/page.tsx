"use client";

import Sidebar from "../../components/Sidebar";
import { 
  HelpCircle, 
  MessageSquare, 
  Book, 
  LifeBuoy, 
  Mail, 
  Phone, 
  ArrowUpRight,
  ChevronRight,
  Terminal,
  Activity,
  Bell,
  Settings,
  ShieldCheck,
  Search
} from "lucide-react";

export default function SupportPage() {
  return (
    <div className="flex min-h-screen bg-[var(--bg-main)]">
      <Sidebar />
      
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="console-header">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <HelpCircle size={14} /> Help & Support <ChevronRight size={12} /> 
            <span className="text-white">Admin Resource Center</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <button className="text-muted hover:text-white transition-colors">
              <Bell size={18} />
            </button>
            <button className="text-muted hover:text-white transition-colors">
              <Settings size={18} />
            </button>
          </div>
        </header>

        <div className="p-8 max-w-5xl space-y-8">
           <div className="flex flex-col gap-1">
             <h1 className="text-2xl font-bold tracking-tight">Support Documentation & Legal Aid</h1>
             <p className="text-sm text-muted">Access implementation guides, technical support, and legal compliance playbooks for your AI triage environment.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="console-card p-6 flex flex-col">
                 <div className="flex gap-4 items-start mb-6">
                    <div className="p-3 bg-brand-primary/10 rounded-lg text-brand-primary">
                      <LifeBuoy size={24} />
                    </div>
                    <div>
                       <h3 className="font-bold">Enterprise Support</h3>
                       <p className="text-xs text-muted mb-4 leading-relaxed">24/7 technical assistance for infrastructure issues, model fine-tuning, and governance configuration.</p>
                       <div className="flex gap-2">
                          <button className="console-btn-primary flex items-center gap-2">
                             <MessageSquare size={14} /> START CHAT
                          </button>
                          <button className="console-btn-secondary">OPEN TICKET</button>
                       </div>
                    </div>
                 </div>
                 <div className="mt-auto space-y-3 pt-6 border-t border-subtle">
                   <div className="flex justify-between items-center text-[11px]">
                      <span className="text-muted">Account Manager</span>
                      <span className="font-bold text-white">Jessica Chen</span>
                   </div>
                   <div className="flex justify-between items-center text-[11px]">
                      <span className="text-muted">Support Tier</span>
                      <span className="font-bold text-brand-success flex items-center gap-1">
                        <ShieldCheck size={12} /> PREMIER
                      </span>
                   </div>
                 </div>
              </div>

              <div className="console-card p-6 flex flex-col">
                 <div className="flex gap-4 items-start mb-6">
                    <div className="p-3 bg-brand-primary/10 rounded-lg text-brand-primary">
                      <Book size={24} />
                    </div>
                    <div>
                       <h3 className="font-bold">Developer Docs</h3>
                       <p className="text-xs text-muted mb-4 leading-relaxed">Full API reference for OpenEnv, custom task creation, and grader implementation guides.</p>
                       <button className="text-brand-primary font-bold text-xs flex items-center gap-1 hover:underline">
                          VIEW DOCUMENTATION HUB <ArrowUpRight size={14} />
                       </button>
                    </div>
                 </div>
                 <div className="mt-auto bg-black/20 p-4 rounded border border-subtle">
                   <div className="flex items-center gap-3 text-xs mb-3 font-bold uppercase tracking-wider text-muted">
                      <Terminal size={14} /> Install CLI Tool
                   </div>
                   <code className="block p-2 bg-[#0b0e14] border border-subtle rounded text-[10px] text-zinc-300 font-mono">
                      npm install -g @openenv/cli-core
                   </code>
                 </div>
              </div>
           </div>

           <section className="console-card p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-subtle">
                 <Activity size={32} className="text-brand-primary" />
              </div>
              <h3 className="text-lg font-bold">System Status: Fully Operational</h3>
              <p className="text-sm text-muted max-w-md mx-auto">All triage clusters, knowledge base engines, and compliance checkers are currently responding within normal SLA parameters.</p>
              <div className="flex justify-center gap-6 pt-4">
                 <div className="flex flex-col">
                    <span className="text-xs font-bold">API Latency</span>
                    <span className="text-lg font-mono font-bold text-brand-success">42ms</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-xs font-bold">Retrieval Accuracy</span>
                    <span className="text-lg font-mono font-bold text-brand-success">99.8%</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-xs font-bold">System Uptime</span>
                    <span className="text-lg font-mono font-bold text-brand-success">99.9%</span>
                 </div>
              </div>
           </section>
        </div>
      </main>
    </div>
  );
}
