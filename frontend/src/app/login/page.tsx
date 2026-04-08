"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, User, AlertCircle, Cpu } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("gateway_token", data.token);
        localStorage.setItem("gateway_user", data.username);
        router.push("/admin");
      } else {
        setError("AUTHENTICATION_FAILED: Invalid corporate credentials.");
      }
    } catch (err) {
      setError("SYSTEM_OFFLINE: Connection to Governance API failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 font-sans">
      {/* Background Watermark */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] border border-white rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] border border-white rounded-full"></div>
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="bg-[#111114] border border-[#232328] rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Top Security Banner */}
          <div className="bg-[#1a1a1e] px-8 py-3 border-b border-[#232328] flex justify-between items-center">

            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 animate-pulse"></div>

            </div>
          </div>

          <div className="p-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-[#1e1e24] border border-[#303038] rounded flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight leading-none uppercase">Governance Gateway</h1>
                <p className="text-[10px] text-[#5c5c64] font-bold tracking-[0.1em] mt-1 uppercase">Adversarial AI Defense Unit</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/5 border-l-2 border-red-600 p-4 flex items-start gap-3 mb-8">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                <p className="text-red-500 text-[11px] font-mono leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-[#5c5c64] uppercase tracking-widest">Operator Identity</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3a3a42] group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#16161a] border border-[#232328] rounded px-10 py-3 text-sm text-white focus:outline-none focus:border-blue-700/50 focus:bg-[#1a1a1e] transition-all placeholder-[#3a3a42]"
                    placeholder="ENTER_UID"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-[#5c5c64] uppercase tracking-widest">Authentication Token</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3a3a42] group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#16161a] border border-[#232328] rounded px-10 py-3 text-sm text-white focus:outline-none focus:border-blue-700/50 focus:bg-[#1a1a1e] transition-all placeholder-[#3a3a42]"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold py-3.5 rounded tracking-[0.1em] uppercase transition-all mt-8 border border-blue-500/20 active:scale-[0.98] disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.1)]"
              >
                {loading ? "Decrypting Session..." : "Establish Secure Link"}
              </button>
            </form>
          </div>

          {/* Compliance Footer */}
          <div className="bg-[#1a1a1e]/50 px-10 py-6 border-t border-[#232328]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-3 h-3 text-[#3a3a42]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
