"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Heart, Users, Calendar, TrendingUp, ShieldAlert,
  Loader2, LogOut, CheckCircle, BarChart3, PieChart, Activity, UserCheck
} from "lucide-react";
import { api } from "@/lib/api";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from "recharts";

export default function AdminDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Client hydration check
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");
    
    if (!token || role !== "admin") {
      router.push("/login");
      return;
    }
    setAdminName(name || "Admin");
    loadAdminMetrics();
  }, []);

  const loadAdminMetrics = async () => {
    setGlobalLoading(true);
    try {
      const docs = await api.doctors.list();
      setDoctorsList(docs);
      
      const appts = await api.appointments.list();
      setAppointmentsList(appts);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  // Mock analytics calculation based on loaded data
  const revenueTotal = appointmentsList.reduce((acc, appt) => acc + 600, 0) + 842000; // base mock + dynamic
  const patientCount = 184 + appointmentsList.length; // simulated unique patients
  const totalCompleted = appointmentsList.filter(a => a.status === "completed").length + 1420;

  // Chart Data
  const monthlyRevenueData = [
    { name: "Jan", revenue: 120000 },
    { name: "Feb", revenue: 150000 },
    { name: "Mar", revenue: 180000 },
    { name: "Apr", revenue: 220000 },
    { name: "May", revenue: 290000 },
    { name: "Jun", revenue: 340000 },
    { name: "Jul", revenue: revenueTotal },
  ];

  const specializationData = [
    { name: "General Physician", count: doctorsList.filter(d => d.specialization === "General Physician").length || 2 },
    { name: "Cardiologist", count: doctorsList.filter(d => d.specialization === "Cardiologist").length || 2 },
    { name: "Dermatologist", count: doctorsList.filter(d => d.specialization === "Dermatologist").length || 1 },
    { name: "Pediatrician", count: doctorsList.filter(d => d.specialization === "Pediatrician").length || 1 },
    { name: "Neurologist", count: doctorsList.filter(d => d.specialization === "Neurologist").length || 1 },
  ];

  const COLORS = ["#3b82f6", "#6366f1", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen">
      {/* Sidebar Panel */}
      <aside className="w-full md:w-64 glass-panel border-r border-white/5 p-6 flex flex-col justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-blue-500 fill-blue-500/20" />
            <span className="font-extrabold text-lg text-white">MedConnect AI</span>
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-white uppercase">
              A
            </div>
            <div>
              <div className="text-white text-xs font-extrabold line-clamp-1">{adminName}</div>
              <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Admin Terminal</div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-1 mb-2">Workspace</span>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 shadow-lg shadow-blue-600/10">
              <Activity className="h-4.5 w-4.5" />
              Hospital Stats
            </div>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <LogOut className="h-4.5 w-4.5" />
          Sign Out
        </button>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-w-5xl">
        {globalLoading ? (
          <div className="h-96 flex flex-col justify-center items-center gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            Loading administrative ledger...
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white">Hospital Statistics</h2>
              <p className="text-slate-400 text-sm mt-1">Global patient ledger oversight and specialization analysis.</p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid md:grid-cols-4 gap-6">
              {/* Metric 1 */}
              <div className="glass-panel p-5 rounded-2xl space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-500/5 w-16 h-16 rounded-full blur-xl"></div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Hospital Revenue</span>
                  <TrendingUp className="h-4.5 w-4.5 text-blue-500" />
                </div>
                <div className="text-xl font-black text-white">₹{revenueTotal.toLocaleString()}</div>
                <span className="text-[10px] text-emerald-400 font-semibold">+18.5% Growth</span>
              </div>
              
              {/* Metric 2 */}
              <div className="glass-panel p-5 rounded-2xl space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-purple-500/5 w-16 h-16 rounded-full blur-xl"></div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Unique Patients</span>
                  <Users className="h-4.5 w-4.5 text-purple-500" />
                </div>
                <div className="text-xl font-black text-white">{patientCount}</div>
                <span className="text-[10px] text-purple-400 font-semibold">Active registrations</span>
              </div>

              {/* Metric 3 */}
              <div className="glass-panel p-5 rounded-2xl space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500/5 w-16 h-16 rounded-full blur-xl"></div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Consultations</span>
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                </div>
                <div className="text-xl font-black text-white">{totalCompleted}</div>
                <span className="text-[10px] text-emerald-400 font-semibold">99.8% Success Rate</span>
              </div>

              {/* Metric 4 */}
              <div className="glass-panel p-5 rounded-2xl space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-yellow-500/5 w-16 h-16 rounded-full blur-xl"></div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Staff</span>
                  <UserCheck className="h-4.5 w-4.5 text-yellow-500" />
                </div>
                <div className="text-xl font-black text-white">{doctorsList.length} Doctors</div>
                <span className="text-[10px] text-slate-400 font-semibold">Verified credentials</span>
              </div>
            </div>

            {/* Graphs Grid */}
            {mounted && (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Graph 1: Area Chart */}
                <div className="glass-panel p-6 rounded-3xl space-y-4">
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="h-4.5 w-4.5 text-blue-500" />
                    Revenue Ledger Trend (2026)
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#fff", fontSize: "11px" }} />
                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Graph 2: Bar Chart */}
                <div className="glass-panel p-6 rounded-3xl space-y-4">
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <PieChart className="h-4.5 w-4.5 text-indigo-500" />
                    Doctors Specialization spread
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={specializationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#fff", fontSize: "11px" }} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {specializationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Vetted Doctor Roster */}
            <div className="space-y-4">
              <h3 className="text-white text-base font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                Vetted Medical Clinicians ({doctorsList.length})
              </h3>
              <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-bold border-b border-white/5">
                      <th className="p-4">Name & Email</th>
                      <th className="p-4">Speciality</th>
                      <th className="p-4">Experience</th>
                      <th className="p-4">Hospital Branch</th>
                      <th className="p-4">Consultation Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {doctorsList.map((doc) => (
                      <tr key={doc.id} className="hover:bg-white/5 text-slate-300">
                        <td className="p-4">
                          <div className="font-bold text-white">{doc.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{doc.email}</div>
                        </td>
                        <td className="p-4 font-semibold text-blue-400 uppercase tracking-wider text-[10px]">{doc.specialization}</td>
                        <td className="p-4 font-semibold">{doc.experience_years} Years</td>
                        <td className="p-4 font-semibold">{doc.hospital_name}</td>
                        <td className="p-4 font-bold text-emerald-400">₹{doc.consultation_fee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
