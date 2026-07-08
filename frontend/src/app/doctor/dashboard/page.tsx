"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Heart, Calendar, Clock, FileText, CheckCircle, AlertTriangle,
  Loader2, User, Sparkles, Plus, Trash2, LogOut, Check, ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";

export default function DoctorDashboard() {
  const router = useRouter();
  const [doctorName, setDoctorName] = useState("");
  
  // Dashboard Metrics
  const [prioritizedPatients, setPrioritizedPatients] = useState<any[]>([]);
  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  
  // Slot planner states
  const [slotsList, setSlotsList] = useState<string[]>([]);
  const [newSlot, setNewSlot] = useState("");
  
  // Queue stats states
  const [doctorStatus, setDoctorStatus] = useState("Available");
  const [currentCallToken, setCurrentCallToken] = useState<number | null>(null);

  // Prescription Drawer States
  const [consultingAppt, setConsultingAppt] = useState<any>(null);
  const [prescriptionText, setPrescriptionText] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");
    
    if (!token || role !== "doctor") {
      router.push("/login");
      return;
    }
    setDoctorName(name || "Doctor");
    loadDoctorMetrics();
  }, []);

  const loadDoctorMetrics = async () => {
    setGlobalLoading(true);
    try {
      // 1. Load today's prioritized patients using Heap priority queue
      const patients = await api.appointments.getTodayPrioritized();
      setPrioritizedPatients(patients);

      // 2. Fetch doctor profile for slots config
      const profileData = await api.auth.getProfile();
      const docProfile = profileData.profile;
      if (docProfile) {
        setSlotsList(docProfile.available_slots || []);
        
        // 3. Fetch queue token details
        const qStatus = await api.appointments.getQueueStatus(docProfile.id);
        setCurrentCallToken(qStatus.active_token);
        setDoctorStatus(qStatus.doctor_status);
      }

      // Check if there is an active patient in consultation
      const active = patients.find((p: any) => p.status === "in-consultation");
      if (active) {
        setActiveConsultation(active);
      } else {
        setActiveConsultation(null);
      }
    } catch (err) {
      console.error("Failed to load doctor dashboard stats:", err);
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  // Update Doctor Status
  const handleUpdateStatus = async (status: string) => {
    setDoctorStatus(status);
    // If we have an active consult, or update queue status
    if (prioritizedPatients.length > 0) {
      const docProfileData = await api.auth.getProfile();
      const docProfile = docProfileData.profile;
      if (docProfile) {
        // Simple update trigger through status calculations in appointments
        alert(`Status updated to: ${status}`);
      }
    }
  };

  // Call Next Patient (popping top of the heap)
  const handleCallNextPatient = async () => {
    // Find first pending/approved appointment in prioritized today's list
    const nextAppt = prioritizedPatients.find(
      (p: any) => p.status === "pending" || p.status === "approved"
    );

    if (!nextAppt) {
      alert("No pending patients in queue for today.");
      return;
    }

    try {
      // Update status to 'in-consultation'
      const updated = await api.appointments.update(nextAppt.id, {
        status: "in-consultation"
      });
      
      setActiveConsultation(updated);
      setConsultingAppt(updated);
      setPrescriptionText("");
      
      loadDoctorMetrics();
    } catch (err: any) {
      alert(err.message || "Failed to update patient consultation.");
    }
  };

  // Complete consultation (writing prescription)
  const handleCompleteConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescriptionText.trim()) {
      alert("Please add prescription notes to complete consultation.");
      return;
    }

    setSubmitLoading(true);
    try {
      await api.appointments.update(consultingAppt.id, {
        status: "completed",
        prescription: prescriptionText
      });
      setConsultingAppt(null);
      setActiveConsultation(null);
      setPrescriptionText("");
      alert("Consultation Completed & Prescription Saved!");
      loadDoctorMetrics();
    } catch (err: any) {
      alert(err.message || "Failed to complete consultation.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Add a slot to scheduling
  const handleAddSlot = async () => {
    if (!newSlot) return;
    if (slotsList.includes(newSlot)) {
      alert("This slot already exists.");
      return;
    }

    const updatedSlots = [...slotsList, newSlot].sort();
    try {
      await api.auth.updateProfile({ available_slots: updatedSlots });
      setSlotsList(updatedSlots);
      setNewSlot("");
    } catch (err) {
      alert("Failed to add slot configuration.");
    }
  };

  // Remove a slot
  const handleRemoveSlot = async (slotToRemove: string) => {
    const updatedSlots = slotsList.filter(s => s !== slotToRemove);
    try {
      await api.auth.updateProfile({ available_slots: updatedSlots });
      setSlotsList(updatedSlots);
    } catch (err) {
      alert("Failed to remove slot configuration.");
    }
  };

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
            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white uppercase">
              D
            </div>
            <div>
              <div className="text-white text-xs font-extrabold line-clamp-1">{doctorName}</div>
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Doctor Terminal</div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-1">Toggles</span>
            <div className="flex flex-col gap-1.5">
              {[
                { status: "Available", color: "text-emerald-400 border-emerald-500/30" },
                { status: "In-Consultation", color: "text-blue-400 border-blue-500/30" },
                { status: "On-Break", color: "text-amber-400 border-amber-500/30" }
              ].map((item) => (
                <button
                  key={item.status}
                  onClick={() => handleUpdateStatus(item.status)}
                  className={`w-full flex justify-between items-center px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    doctorStatus === item.status
                      ? "bg-white/5 border-white/10 text-white"
                      : "border-transparent text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full bg-current ${item.color.split(" ")[0]}`}></span>
                    {item.status}
                  </span>
                  {doctorStatus === item.status && <Check className="h-4.5 w-4.5 text-blue-500" />}
                </button>
              ))}
            </div>
          </div>
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
            Loading clinician parameters...
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white">Consultation Hub</h2>
                <p className="text-slate-400 text-sm mt-1">Order medical priority queues and write patient prescriptions.</p>
              </div>

              {/* Call controller bar */}
              <div className="flex gap-2">
                <button
                  onClick={handleCallNextPatient}
                  disabled={!!activeConsultation}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs glow-primary transition-all disabled:opacity-40"
                >
                  Call Next Patient
                </button>
              </div>
            </div>

            {/* Active Consultation Panel */}
            {activeConsultation && (
              <div className="glass-panel p-6 rounded-3xl border-blue-500/30 glow-primary relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 right-0 bg-blue-500/5 w-32 h-32 rounded-full blur-3xl"></div>
                <div className="flex items-center gap-2 text-xs text-blue-400 font-bold uppercase tracking-widest mb-3">
                  <Sparkles className="h-4.5 w-4.5 text-blue-400" />
                  Active Consultation In Progress
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left: Patient Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-white text-xl font-extrabold">Patient Details</h3>
                      <span className="text-slate-400 text-xs font-semibold uppercase">Token Number: #{activeConsultation.queue_token}</span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="text-xs flex justify-between">
                        <span className="text-slate-400">Symptoms Reason:</span>
                        <span className="text-white font-bold max-w-[200px] text-right truncate">
                          {activeConsultation.symptoms_description || "Routine Consultation"}
                        </span>
                      </div>
                      <div className="text-xs flex justify-between">
                        <span className="text-slate-400">Schedule Interval:</span>
                        <span className="text-white font-bold">{activeConsultation.slot_label}</span>
                      </div>
                      <div className="text-xs flex justify-between">
                        <span className="text-slate-400">Urgency:</span>
                        <span className="text-red-400 font-bold uppercase">
                          {activeConsultation.urgency_level === 3 ? "Emergency" : activeConsultation.urgency_level === 2 ? "Urgent" : "Normal"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Write Prescription */}
                  <form onSubmit={handleCompleteConsultation} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Write Prescription Notes</label>
                      <textarea
                        rows={4}
                        required
                        value={prescriptionText}
                        onChange={(e) => setPrescriptionText(e.target.value)}
                        placeholder="e.g. Paracetamol 650mg TDS for 3 days. Amoxicillin 500mg BD for 5 days. Dry cough syrup 10ml TDS."
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-blue-500/50 transition-all font-semibold leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs glow-success flex justify-center items-center gap-1.5 transition-all"
                    >
                      {submitLoading ? (
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4.5 w-4.5" />
                          Complete Consultation
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Middle Split panels */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* Patient Consultation Queue */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-white text-base font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Today's Patient Queue (Sorted by Urgency)
                </h3>

                <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
                  {prioritizedPatients.length > 0 ? (
                    <div className="flex flex-col divide-y divide-white/5">
                      {prioritizedPatients.map((pat) => (
                        <div
                          key={pat.id}
                          className={`p-4 flex justify-between items-center transition-all ${
                            pat.status === "in-consultation"
                              ? "bg-blue-600/10"
                              : "hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Priority badge */}
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                              pat.urgency_level === 3
                                ? "bg-red-500/15 border-red-500/25 text-red-400 animate-pulse"
                                : pat.urgency_level === 2
                                ? "bg-amber-500/15 border-amber-500/25 text-amber-400"
                                : "bg-blue-500/15 border-blue-500/25 text-blue-400"
                            }`}>
                              {pat.urgency_level === 3 ? "Emergency" : pat.urgency_level === 2 ? "Urgent" : "Normal"}
                            </span>

                            <div>
                              <div className="text-white text-xs font-bold">Patient ID: {pat.id.substring(0, 8)}</div>
                              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Reason: {pat.symptoms_description || "Routine"}</div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-300 font-bold block">{pat.slot_label}</span>
                            <span className="text-[9px] text-slate-500 block mt-0.5">Token: #{pat.queue_token}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 py-12 italic text-xs">
                      No patients registered in queue today.
                    </div>
                  )}
                </div>
              </div>

              {/* Slots Scheduler Panel */}
              <div className="space-y-4">
                <h3 className="text-white text-base font-bold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-500" />
                  Availability Slots
                </h3>

                <div className="glass-panel p-5 rounded-2xl space-y-4">
                  {/* Add Slot */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 16:30"
                      value={newSlot}
                      onChange={(e) => setNewSlot(e.target.value)}
                      className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-semibold outline-none focus:border-blue-500/50"
                    />
                    <button
                      onClick={handleAddSlot}
                      className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-all duration-300"
                    >
                      <Plus className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Slots display */}
                  <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pt-2">
                    {slotsList.length > 0 ? (
                      slotsList.map((slot) => (
                        <div
                          key={slot}
                          className="flex items-center gap-2 bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-lg text-slate-300 text-xs font-semibold"
                        >
                          {slot}
                          <button
                            onClick={() => handleRemoveSlot(slot)}
                            className="text-red-400 hover:text-red-300 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-500 text-xs italic">No configured available slots</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
