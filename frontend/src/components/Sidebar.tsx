"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BarChart3, 
  ShieldAlert, 
  Settings, 
  BookOpen,
  HelpCircle,
  Zap
} from "lucide-react";

const menuItems = [
  { name: "Inbound Gateway", Icon: Zap, path: "/inbound" },
  { name: "Compliance Audit", Icon: ShieldAlert, path: "/admin/stress" },
  { name: "Triage Simulator", Icon: LayoutDashboard, path: "/" },
  { name: "Executive Stats", Icon: BarChart3, path: "/admin" },
];

const secondaryItems = [
  { name: "Settings", Icon: Settings, path: "/settings" },
  { name: "Support", Icon: HelpCircle, path: "/support" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[var(--bg-sidebar)] border-r border-subtle flex flex-col fixed inset-y-0 left-0 z-40">
      <div className="h-12 flex items-center px-6 border-b border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-primary rounded flex items-center justify-center text-white font-bold text-xs">
            OE
          </div>
          <span className="font-bold text-sm tracking-tight">OpenEnv Console</span>
        </div>
      </div>

      <nav className="flex-1 py-4">
        <div className="px-3 mb-2">
          <p className="px-3 text-[10px] font-bold text-muted uppercase tracking-wider">
            Main Navigation
          </p>
        </div>
        <div className="space-y-0.5">
          {menuItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.path}
              className={`console-sidebar-item ${pathname === item.path ? 'active' : ''}`}
            >
              <item.Icon size={18} />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>

        <div className="px-3 mt-8 mb-2">
          <p className="px-3 text-[10px] font-bold text-muted uppercase tracking-wider">
            Management
          </p>
        </div>
        <div className="space-y-0.5">
          {secondaryItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.path}
              className="console-sidebar-item"
            >
              <item.Icon size={18} />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-subtle bg-black/10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold border border-white/10">
            SA
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold truncate">Saika Rthan</p>
            <p className="text-[10px] text-muted truncate">Admin @ Scaler</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
