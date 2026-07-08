"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Heart, Search, Brain, Clock, FileText, Sparkles, 
  ArrowRight, CheckCircle, Activity, Star, MapPin 
} from "lucide-react";
import { api } from "@/lib/api";

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Fetch Trie autocomplete suggestions from backend
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const results = await api.doctors.autocomplete(searchQuery);
        setSuggestions(results);
      } catch (err) {
        console.error("Autocomplete failed:", err);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Click outside listener for autocomplete suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search doctors
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowSuggestions(false);
    try {
      const results = await api.doctors.list({
        query: searchQuery,
        specialization: selectedSpecialty || undefined
      });
      setDoctorsList(results);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = async (doc: any) => {
    setSearchQuery(doc.name);
    setShowSuggestions(false);
    setLoading(true);
    try {
      const results = await api.doctors.list({ query: doc.name });
      setDoctorsList(results);
    } catch (err) {
      console.error("Search by suggestion failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run initial listing
  useEffect(() => {
    const loadInitialDoctors = async () => {
      try {
        const results = await api.doctors.list();
        setDoctorsList(results.slice(0, 3)); // show top 3 initially
      } catch (err) {
        console.error("Initial load failed:", err);
      }
    };
    loadInitialDoctors();
  }, []);

  const specialties = [
    "General Physician",
    "Cardiologist",
    "Dermatologist",
    "Pediatrician",
    "Neurologist"
  ];

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Navigation */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-blue-600/20 p-2.5 rounded-xl border border-blue-500/20 group-hover:scale-110 transition-all duration-300">
            <Heart className="h-6 w-6 text-blue-500 fill-blue-500/20 animate-pulse" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            MedConnect <span className="text-white text-xl font-normal">AI</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link href="/login" className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 font-semibold text-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300">
            Sign In
          </Link>
          <Link href="/register" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-500 hover:to-indigo-500 glow-primary transition-all duration-300">
            Join Portal
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center">
        {/* Hero Info */}
        <div className="text-center max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-6 animate-bounce">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Driven Medical Queue & Scheduler
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-white mb-6">
            Intelligent Care, <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
              Zero Waiting Time.
            </span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed mb-8">
            Check symptoms instantly, upload diagnostic reports for AI analysis, search doctors with Trie autocomplete, and book appointments prioritizing emergency cases.
          </p>
        </div>

        {/* Search Bar Section with Trie Autocomplete */}
        <div className="w-full max-w-2xl mb-16 relative" ref={suggestionRef}>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 w-full bg-slate-900/60 p-2.5 rounded-2xl border border-white/10 backdrop-blur-xl">
            <div className="flex-1 flex items-center px-3 relative">
              <Search className="h-5 w-5 text-slate-400 mr-2.5" />
              <input
                type="text"
                placeholder="Search doctors, specializations..."
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full bg-transparent text-white font-medium placeholder-slate-400 outline-none py-2 text-sm"
              />
            </div>
            
            <div className="flex items-center border-t md:border-t-0 md:border-l border-white/10 px-3 py-2 md:py-0">
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="bg-transparent text-slate-300 text-sm font-medium outline-none cursor-pointer w-full md:w-auto"
              >
                <option value="" className="bg-slate-950 text-white">All Specialities</option>
                {specialties.map((s) => (
                  <option key={s} value={s} className="bg-slate-950 text-white">{s}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2"
            >
              Search
            </button>
          </form>

          {/* Autocomplete Suggestions Box */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl z-40">
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSuggestionClick(item)}
                  className="px-5 py-3 hover:bg-white/5 border-b border-white/5 cursor-pointer flex justify-between items-center transition-all duration-200"
                >
                  <div>
                    <div className="text-white text-sm font-semibold">{item.name}</div>
                    <div className="text-xs text-slate-400">{item.specialization}</div>
                  </div>
                  <div className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {item.hospital}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Doctor Search Results Display */}
        {doctorsList.length > 0 && (
          <div className="w-full max-w-4xl mb-20 animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Matching Doctors ({doctorsList.length})
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {doctorsList.map((doc) => (
                <div key={doc.id} className="glass-panel rounded-2xl p-6 glass-panel-hover flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-white font-bold text-lg">{doc.name}</h4>
                        <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">{doc.specialization}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-lg font-bold">
                        <Star className="h-3.5 w-3.5 fill-yellow-400" />
                        {doc.rating || "4.8"}
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs line-clamp-3 mb-4 leading-relaxed">
                      {doc.biography || "Experienced physician dedicated to providing compassionate, evidence-based care to patients."}
                    </p>
                  </div>
                  
                  <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Experience:</span>
                      <span className="text-white font-bold">{doc.experience_years} Years</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Consultation Fee:</span>
                      <span className="text-emerald-400 font-bold">₹{doc.consultation_fee}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Hospital:</span>
                      <span className="text-white font-bold">{doc.hospital_name}</span>
                    </div>
                    
                    <Link
                      href={`/login?redirect=book&docId=${doc.id}`}
                      className="mt-2 w-full py-2 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 hover:border-transparent text-blue-400 hover:text-white font-semibold text-xs rounded-xl text-center transition-all duration-300"
                    >
                      Book Appointment
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Cards Grid */}
        <div className="w-full max-w-5xl mb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">Core Smart Features</h2>
            <p className="text-slate-400 text-sm md:text-base">Built to streamline medical scheduler flows using state-of-the-art AI models and optimized algorithms.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
              <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 w-fit">
                <Brain className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-white font-bold text-lg">AI Symptom Checker</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Describe your symptoms in natural language. Gemini recommends the correct specialty to book and suggests tests.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
              <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20 w-fit">
                <FileText className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-white font-bold text-lg">AI Medical Reports</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Upload blood test panels or pathology PDFs. Get interactive parameter indicators with abnormal readings highlighted.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 w-fit">
                <Clock className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-white font-bold text-lg">Live Queue Tracker</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Check active token progress. Get accurate waiting time forecasts generated via smart priority queues.
              </p>
            </div>
            {/* Feature 4 */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
              <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20 w-fit">
                <Sparkles className="h-6 w-6 text-yellow-500" />
              </div>
              <h3 className="text-white font-bold text-lg">Smart Routing</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Recommends doctors using BFS path traversals across collaborative networks and hospital referrals.
              </p>
            </div>
          </div>
        </div>


      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} MedConnect AI Portal. All Rights Reserved. Built with Next.js 15, FastAPI & Gemini AI.
      </footer>
    </div>
  );
}
