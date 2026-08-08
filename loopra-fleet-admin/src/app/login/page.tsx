"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import api from "@/lib/api";
import { Shield, Lock, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { addToast } = useNotificationStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast("warning", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password: password.trim()
      });

      const { success, token, user } = response.data;
      if (success && user.role === "FLEET_OPERATOR") {
        login(token, user);
        addToast("success", `Welcome back, ${user.name}!`);
        router.push("/dashboard");
      } else {
        addToast("error", "Access denied: Unauthorized role");
      }
    } catch (err: any) {
      // Axios interceptor already fires toast notifications
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex bg-slate-950 font-sans">
      {/* Visual panel */}
      <div className="hidden lg:flex lg:w-1/2 h-full bg-slate-900 border-r border-slate-800 flex-col justify-between p-12 relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-display font-black text-sm">
            L
          </div>
          <span className="font-display text-white text-base font-black tracking-wide">LOOPRA</span>
        </div>

        <div className="space-y-4 max-w-md relative z-10">
          <h1 className="text-4xl font-black text-white font-display tracking-tight leading-tight">
            Fleet Operations Control Center.
          </h1>
          <p className="text-sm text-slate-400 font-semibold leading-relaxed">
            Manage drivers, schedule dispatches, monitor real-time tracking metrics, and keep compliance details aligned.
          </p>
        </div>

        <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest relative z-10">
          Loopra Inc. &copy; 2026. All rights reserved.
        </div>
      </div>

      {/* Login panel */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-center items-center p-6 bg-slate-950">
        <div className="max-w-md w-full space-y-8">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6 lg:hidden">
              <Shield size={24} />
            </div>
            <h2 className="text-2xl font-black text-white font-display tracking-tight leading-none">
              Sign In
            </h2>
            <p className="text-xs text-slate-500 font-bold tracking-wider uppercase mt-3">
              Loopra Fleet Operator Access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-200 text-xs font-bold transition-all focus:outline-none placeholder-slate-600"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Account Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-200 text-xs font-bold transition-all focus:outline-none placeholder-slate-600"
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-indigo-600/10 mt-6"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-200 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
