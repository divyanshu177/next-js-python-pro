"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, User, Mail, Lock, Loader2, ArrowRight, ShieldCheck, Activity } from "lucide-react";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.auth.register({ name, email, password, role });
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
      <Link href="/" className="flex items-center gap-3 mb-8 group">
        <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/20 group-hover:scale-105 transition-all">
          <Heart className="h-5 w-5 text-blue-500 fill-blue-500/20" />
        </div>
        <span className="font-extrabold text-xl tracking-tight text-white">
          MedConnect <span className="text-blue-500 font-bold">AI</span>
        </span>
      </Link>

      <div className="w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 bg-blue-500/10 w-24 h-24 rounded-full blur-2xl"></div>
        
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black text-white">Create Account</h2>
          <p className="text-slate-400 text-sm mt-1">Start your journey with MedConnect AI</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold text-center">
            Registration Successful! Redirecting to sign in...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
            <div className="flex items-center bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-blue-500/50 transition-all duration-300">
              <User className="h-4 w-4 text-slate-500 mr-2.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="bg-transparent text-white text-sm outline-none w-full font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="flex items-center bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-blue-500/50 transition-all duration-300">
              <Mail className="h-4 w-4 text-slate-500 mr-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-transparent text-white text-sm outline-none w-full font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <div className="flex items-center bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-blue-500/50 transition-all duration-300">
              <Lock className="h-4 w-4 text-slate-500 mr-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent text-white text-sm outline-none w-full font-medium"
              />
            </div>
          </div>

          {/* Role selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">I am registering as a</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole("patient")}
                className={`py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  role === "patient"
                    ? "bg-blue-600 border-transparent text-white shadow-lg shadow-blue-600/20"
                    : "bg-slate-950/60 border-white/10 text-slate-400 hover:bg-white/5"
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                Patient
              </button>
              
              <button
                type="button"
                onClick={() => setRole("doctor")}
                className={`py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  role === "doctor"
                    ? "bg-blue-600 border-transparent text-white shadow-lg shadow-blue-600/20"
                    : "bg-slate-950/60 border-white/10 text-slate-400 hover:bg-white/5"
                }`}
              >
                <Heart className="h-3.5 w-3.5" />
                Doctor
              </button>

              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  role === "admin"
                    ? "bg-blue-600 border-transparent text-white shadow-lg shadow-blue-600/20"
                    : "bg-slate-950/60 border-white/10 text-slate-400 hover:bg-white/5"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm glow-primary flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                Register Account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400 border-t border-white/5 pt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 font-bold hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
