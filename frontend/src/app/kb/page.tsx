"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { 
  BookOpen, 
  Search, 
  ExternalLink, 
  FileText, 
  Clock, 
  Tag,
  ChevronRight,
  Bell,
  Settings,
  Filter
} from "lucide-react";

export default function KnowledgeBasePage() {
  const [kb, setKb] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKb = async () => {
      try {
        const resp = await fetch("/kb/all");
        const data = await resp.json();
        setKb(data);
      } catch (err) {
        console.error("Failed to fetch KB:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchKb();
  }, []);

  const filteredKeys = Object.keys(kb).filter(key => 
    key.toLowerCase().includes(searchTerm.toLowerCase()) || 
    kb[key].toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)]">
      <Sidebar />
      
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="console-header">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <BookOpen size={14} /> Knowledge Base <ChevronRight size={12} /> 
            <span className="text-white">Documentation Library</span>
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

        <div className="p-8 space-y-6">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight">Corporate Expert Knowledge</h1>
              <p className="text-sm text-muted">Unified repository for SLA policies, governance compliance, and technical playbooks.</p>
            </div>
            <div className="flex gap-2">
               <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                <input 
                  type="text" 
                  placeholder="Search articles..." 
                  className="bg-[var(--bg-card)] border border-subtle rounded-md pl-9 pr-4 py-1.5 text-xs focus:border-brand-primary outline-none min-w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="console-btn-secondary flex items-center gap-2">
                <Filter size={14} /> Filter
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredKeys.length > 0 ? filteredKeys.map((key) => (
              <div key={key} className="console-card group hover:border-brand-primary transition-all flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-brand-primary/10 rounded-md text-brand-primary">
                      <FileText size={18} />
                    </div>
                    <span className="text-[10px] font-bold text-muted bg-white/5 px-2 py-0.5 rounded border border-subtle">
                      ACTIVE
                    </span>
                  </div>
                  <h3 className="font-bold text-sm mb-2 group-hover:text-brand-primary transition-colors">{key}</h3>
                  <p className="text-[11px] text-muted line-clamp-4 leading-relaxed font-mono">
                    {kb[key]}
                  </p>
                </div>
                <div className="px-5 py-3 border-t border-subtle bg-black/10 flex justify-between items-center text-[10px] font-bold text-muted">
                  <div className="flex items-center gap-2">
                    <Clock size={12} /> Last Updated: Today
                  </div>
                  <button className="text-brand-primary hover:underline flex items-center gap-1">
                    VIEW FULL <ExternalLink size={10} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center">
                 <p className="text-muted text-sm italic">No documentation found matching your search query.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
