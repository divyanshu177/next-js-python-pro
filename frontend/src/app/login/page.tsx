"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get("redirect");
  const docId = searchParams.get("docId");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.auth.login({ email, password });
      
      // Store tokens
      localStorage.setItem("token", response.access_token);
      localStorage.setItem("role", response.role);
      localStorage.setItem("name", response.name);

      // Handle redirect params
      if (redirect === "book" && docId) {
        router.push(`/patient/dashboard?bookDoc=${docId}`);
        return;
      }

      // Default role based routing
      if (response.role === "doctor") {
        router.push("/doctor/dashboard");
      } else if (response.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/patient/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
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
          <h2 className="text-2xl font-black text-white">Welcome Back</h2>
          <p className="text-slate-400 text-sm mt-1">Access your MedConnect medical portal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
            </div>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm glow-primary flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400 border-t border-white/5 pt-6">
          New to MedConnect?{" "}
          <Link href="/register" className="text-blue-400 font-bold hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex flex-col justify-center items-center text-slate-400">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
        Initializing Login Portal...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
