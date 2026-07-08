"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Heart, User, Calendar, FileText, Brain, Clock, ShieldAlert,
  Loader2, Search, Star, MapPin, Sparkles, Upload, LogOut, CheckCircle, AlertTriangle
} from "lucide-react";
import { api } from "@/lib/api";

export default function PatientDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("symptoms"); // symptoms, book, reports, queue, appointments
  const [patientName, setPatientName] = useState("");
  
  // States for Doctor Search & Booking
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [bookingDoc, setBookingDoc] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState("");
  const [bookingUrgency, setBookingUrgency] = useState(1);
  const [bookingSymptoms, setBookingSymptoms] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");
  
  // AI Symptom Checker States
  const [symptomsInput, setSymptomsInput] = useState("");
  const [symptomsResult, setSymptomsResult] = useState<any>(null);
  const [symptomsLoading, setSymptomsLoading] = useState(false);
  
  // Medical Reports States
  const [reports, setReports] = useState<any[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  
  // Live Queue Tracker States
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [activeDoctorForQueue, setActiveDoctorForQueue] = useState<any>(null);
  
  // Appointments States
  const [appointments, setAppointments] = useState<any[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Authenticate user & load initial stats
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");
    
    if (!token || role !== "patient") {
      router.push("/login");
      return;
    }
    setPatientName(name || "Patient");
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setGlobalLoading(true);
    try {
      // 1. Fetch doctors list
      const docs = await api.doctors.list();
      setDoctors(docs);

      // 2. Fetch reports
      const reps = await api.reports.list();
      setReports(reps);

      // 3. Fetch appointments
      const appts = await api.appointments.list();
      setAppointments(appts);

      // 4. Auto check if there is an active queue for today's appointment
      const today = new Date().toISOString().split("T")[0];
      const todayAppt = appts.find(
        (a: any) => a.appointment_date === today && a.status === "approved"
      );
      if (todayAppt) {
        const docDetails = docs.find((d: any) => d.id === todayAppt.doctor_id);
        setActiveDoctorForQueue(docDetails);
        const qStat = await api.appointments.getQueueStatus(todayAppt.doctor_id);
        setQueueStatus(qStat);
      }
    } catch (err) {
      console.error("Failed to load initial patient metrics:", err);
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  // AI Symptom Checker Action
  const handleCheckSymptoms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomsInput.trim()) return;
    setSymptomsLoading(true);
    setSymptomsResult(null);
    try {
      const result = await api.ai.checkSymptoms(symptomsInput);
      setSymptomsResult(result);
    } catch (err: any) {
      console.error(err);
      alert("AI Symptom Checker failed. Please retry.");
    } finally {
      setSymptomsLoading(false);
    }
  };

  // Book Appointment Action
  const handleOpenBookModal = (doc: any) => {
    setBookingDoc(doc);
    setBookingDate(new Date().toISOString().split("T")[0]); // default today
    setBookingSlot(doc.available_slots?.[0] || "09:00");
    setBookingUrgency(1);
    setBookingSymptoms("");
    setBookingSuccess(false);
    setBookingError("");
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError("");
    setBookingSuccess(false);
    
    // Parse slot start & end
    // E.g. start "09:00", end "09:30"
    const startHour = parseInt(bookingSlot.split(":")[0]);
    const startMin = parseInt(bookingSlot.split(":")[1]);
    
    // add 30 mins
    let endMin = startMin + 30;
    let endHour = startHour;
    if (endMin >= 60) {
      endMin = 0;
      endHour += 1;
    }
    
    const startTimeStr = `${bookingSlot}:00`;
    const endTimeStr = `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}:00`;
    const slotLabelStr = `${bookingSlot} - ${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`;

    try {
      await api.appointments.book({
        doctor_id: bookingDoc.id,
        appointment_date: bookingDate,
        start_time: startTimeStr,
        end_time: endTimeStr,
        slot_label: slotLabelStr,
        urgency_level: bookingUrgency,
        symptoms_description: bookingSymptoms
      });
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingDoc(null);
        loadInitialData(); // Refresh lists
        setActiveTab("appointments");
      }, 1500);
    } catch (err: any) {
      setBookingError(err.message || "Overlap detected or invalid slot scheduling.");
    }
  };

  // Report Upload Action
  const handleReportUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploadLoading(true);
    setUploadError("");
    try {
      const response = await api.reports.upload(uploadFile);
      setReports([response, ...reports]);
      setUploadFile(null);
      setSelectedReport(response);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload and analyze report.");
    } finally {
      setUploadLoading(false);
    }
  };

  // Quick refresh queue status
  const refreshQueue = async () => {
    if (activeDoctorForQueue) {
      try {
        const qStat = await api.appointments.getQueueStatus(activeDoctorForQueue.id);
        setQueueStatus(qStat);
      } catch (err) {
        console.error("Queue refresh failed:", err);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen">
      {/* Sidebar Panel */}
      <aside className="w-full md:w-64 glass-panel border-r border-white/5 p-6 flex flex-col justify-between">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-blue-500 fill-blue-500/20" />
            <span className="font-extrabold text-lg text-white">MedConnect AI</span>
          </div>

          {/* User profile */}
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white uppercase">
              {patientName[0]}
            </div>
            <div>
              <div className="text-white text-xs font-extrabold line-clamp-1">{patientName}</div>
              <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Patient Portal</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {[
              { id: "symptoms", label: "Symptom Checker", icon: Brain },
              { id: "book", label: "Book Doctor", icon: Search },
              { id: "reports", label: "Medical Reports", icon: FileText },
              { id: "queue", label: "Live Queue status", icon: Clock },
              { id: "appointments", label: "My Bookings", icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {tab.label}
                </button>
              );
            })}
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
            Loading portal configurations...
          </div>
        ) : (
          <>
            {/* TAB: Symptom Checker */}
            {activeTab === "symptoms" && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">AI Symptom Checker</h2>
                  <p className="text-slate-400 text-sm mt-1">Describe symptoms to query suitable specialties and causes powered by Gemini.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Checker Form */}
                  <form onSubmit={handleCheckSymptoms} className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Symptoms Details</label>
                      <textarea
                        rows={6}
                        required
                        value={symptomsInput}
                        onChange={(e) => setSymptomsInput(e.target.value)}
                        placeholder="e.g. Fever, cough, and body aches for 3 days. Also experiencing slight breathing congestion."
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-white text-sm outline-none placeholder-slate-500 focus:border-blue-500/50 transition-all font-medium leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={symptomsLoading}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm glow-primary flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50"
                    >
                      {symptomsLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Gemini Analyzing Symptoms...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4.5 w-4.5" />
                          Check Symptoms
                        </>
                      )}
                    </button>
                  </form>

                  {/* Checker Results */}
                  <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center min-h-[300px]">
                    {symptomsResult ? (
                      <div className="space-y-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Recommended Consult</span>
                            <h3 className="text-white text-xl font-extrabold mt-1">{symptomsResult.recommended_specialty}</h3>
                          </div>
                          
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                            symptomsResult.urgency_level === "Emergency" 
                              ? "bg-red-500/10 border-red-500/20 text-red-400 glow-danger"
                              : symptomsResult.urgency_level === "Urgent"
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400 glow-warning"
                              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 glow-success"
                          }`}>
                            {symptomsResult.urgency_level} Priority
                          </span>
                        </div>

                        {/* Potential Causes */}
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Possible Causes</h4>
                          <ul className="space-y-1">
                            {symptomsResult.possible_causes.map((cause: string, i: number) => (
                              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                <span className="text-blue-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                {cause}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Recommended Tests */}
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Recommended Tests</h4>
                          <div className="flex flex-wrap gap-2">
                            {symptomsResult.recommended_tests.map((test: string, i: number) => (
                              <span key={i} className="text-xs font-semibold bg-white/5 border border-white/5 text-slate-300 px-2.5 py-1 rounded-lg">
                                {test}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="flex items-start gap-2 p-3 bg-white/5 border border-white/5 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                          <ShieldAlert className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          <span>{symptomsResult.disclaimer}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-slate-500 flex flex-col items-center gap-2">
                        <Brain className="h-10 w-10 opacity-30 text-blue-500" />
                        <span className="text-sm font-semibold">Enter details and run analysis.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Book Doctor */}
            {activeTab === "book" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">Find & Book Specialist</h2>
                  <p className="text-slate-400 text-sm mt-1">Select from our vetted clinicians and book conflict-free schedule intervals.</p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col md:flex-row gap-3 bg-slate-900/60 p-3 rounded-2xl border border-white/10">
                  <div className="flex-1 flex items-center px-2">
                    <Search className="h-4.5 w-4.5 text-slate-400 mr-2.5" />
                    <input
                      type="text"
                      placeholder="Filter by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent text-white text-sm outline-none placeholder-slate-500 w-full"
                    />
                  </div>
                  
                  <div className="border-t md:border-t-0 md:border-l border-white/10 px-2 py-2 md:py-0">
                    <select
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                      className="bg-transparent text-slate-300 text-sm font-medium outline-none cursor-pointer w-full md:w-auto"
                    >
                      <option value="" className="bg-slate-950 text-white">All Specialities</option>
                      {["General Physician", "Cardiologist", "Dermatologist", "Pediatrician", "Neurologist"].map((s) => (
                        <option key={s} value={s} className="bg-slate-950 text-white">{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Doctor Listing Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {doctors
                    .filter(d => !selectedSpecialty || d.specialization === selectedSpecialty)
                    .filter(d => !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((doc) => (
                      <div key={doc.id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-white font-bold text-lg">{doc.name}</h3>
                              <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">{doc.specialization}</span>
                            </div>
                            <span className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs px-2.5 py-1 rounded-lg font-bold">
                              <Star className="h-3 w-3 fill-yellow-400" />
                              {doc.rating}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                            {doc.biography || "Compassionate health specialist providing advanced medical solutions and patient consultations."}
                          </p>

                          <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-4 mb-4">
                            <div>
                              <span className="text-slate-400">Experience:</span>
                              <div className="text-white font-bold">{doc.experience_years} Years</div>
                            </div>
                            <div>
                              <span className="text-slate-400">Consultation Fee:</span>
                              <div className="text-emerald-400 font-bold">₹{doc.consultation_fee}</div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenBookModal(doc)}
                          className="w-full py-2 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/25 hover:border-transparent text-blue-400 hover:text-white font-bold text-xs rounded-xl transition-all duration-300"
                        >
                          Book consultation
                        </button>
                      </div>
                    ))}
                </div>

                {/* Booking Overlay Modal */}
                {bookingDoc && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
                    <div className="w-full max-w-md glass-panel rounded-2xl p-6 relative">
                      <h3 className="text-white text-lg font-bold mb-1">Book: {bookingDoc.name}</h3>
                      <p className="text-xs text-slate-400 mb-4">{bookingDoc.specialization} • {bookingDoc.hospital_name}</p>

                      {bookingError && (
                        <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center">
                          {bookingError}
                        </div>
                      )}

                      {bookingSuccess && (
                        <div className="mb-4 p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold text-center">
                          Appointment Booked Successfully!
                        </div>
                      )}

                      <form onSubmit={handleBookSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</label>
                            <input
                              type="date"
                              required
                              value={bookingDate}
                              onChange={(e) => setBookingDate(e.target.value)}
                              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-semibold outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Slot</label>
                            <select
                              value={bookingSlot}
                              onChange={(e) => setBookingSlot(e.target.value)}
                              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-semibold outline-none"
                            >
                              {(bookingDoc.available_slots || ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]).map((slot: string) => (
                                <option key={slot} value={slot}>{slot}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Urgency Level</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { val: 1, label: "Normal" },
                              { val: 2, label: "Urgent" },
                              { val: 3, label: "Emergency" }
                            ].map((level) => (
                              <button
                                key={level.val}
                                type="button"
                                onClick={() => setBookingUrgency(level.val)}
                                className={`py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                  bookingUrgency === level.val
                                    ? level.val === 3
                                      ? "bg-red-600 text-white border-transparent"
                                      : level.val === 2
                                      ? "bg-amber-500 text-white border-transparent"
                                      : "bg-blue-600 text-white border-transparent"
                                    : "bg-slate-950/60 border-white/10 text-slate-400"
                                }`}
                              >
                                {level.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Symptoms / Reason</label>
                          <textarea
                            rows={3}
                            value={bookingSymptoms}
                            onChange={(e) => setBookingSymptoms(e.target.value)}
                            placeholder="Describe symptoms briefly..."
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white text-xs font-semibold outline-none"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setBookingDoc(null)}
                            className="flex-1 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 font-bold text-xs hover:bg-white/10 transition-all"
                          >
                            Cancel
                          </button>
                          
                          <button
                            type="submit"
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/10 transition-all"
                          >
                            Confirm Booking
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Medical Reports Hub */}
            {activeTab === "reports" && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">Medical Reports Summarizer</h2>
                  <p className="text-slate-400 text-sm mt-1">Upload blood panel PDF tests to get interactive parameter tables and clinically compiled summaries.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {/* Uploader & List panel */}
                  <div className="md:col-span-1 space-y-6">
                    <form onSubmit={handleReportUpload} className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
                      <h4 className="text-white text-xs font-bold uppercase tracking-wider">Upload PDF Panel</h4>
                      
                      <div className="border border-dashed border-white/15 hover:border-blue-500/40 rounded-xl p-6 text-center cursor-pointer relative bg-slate-950/20 group transition-all duration-300">
                        <input
                          type="file"
                          accept=".pdf"
                          required
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Upload className="h-7 w-7 text-slate-500 mx-auto group-hover:text-blue-400 group-hover:scale-110 transition-all duration-300 mb-2" />
                        <span className="text-[10px] text-slate-400 font-semibold block truncate">
                          {uploadFile ? uploadFile.name : "Select Blood Report (PDF)"}
                        </span>
                      </div>

                      {uploadError && (
                        <div className="text-red-400 text-[10px] font-bold text-center">
                          {uploadError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={uploadLoading || !uploadFile}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2"
                      >
                        {uploadLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            AI Analyzing...
                          </>
                        ) : (
                          "Summarize Report"
                        )}
                      </button>
                    </form>

                    {/* Historical report selections */}
                    <div className="glass-panel p-5 rounded-2xl space-y-3">
                      <h4 className="text-white text-xs font-bold uppercase tracking-wider border-b border-white/5 pb-2">History</h4>
                      {reports.length > 0 ? (
                        <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto">
                          {reports.map((rep) => (
                            <button
                              key={rep.id}
                              onClick={() => setSelectedReport(rep)}
                              className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left border transition-all ${
                                selectedReport?.id === rep.id
                                  ? "bg-blue-600/10 border-blue-500/30 text-white"
                                  : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <FileText className="h-4.5 w-4.5 shrink-0" />
                              <div className="truncate text-xs font-semibold">
                                {rep.file_name}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-500 text-xs italic text-center py-4">No reports recorded</div>
                      )}
                    </div>
                  </div>

                  {/* Summary display panel */}
                  <div className="md:col-span-2 glass-panel p-6 rounded-2xl min-h-[300px]">
                    {selectedReport && selectedReport.ai_summary ? (
                      <div className="space-y-6">
                        <div>
                          <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">AI Clinical Assessment</span>
                          <h3 className="text-white text-lg font-extrabold mt-1">{selectedReport.file_name}</h3>
                          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                            {selectedReport.ai_summary.summary}
                          </p>
                        </div>

                        {/* High/Low badging indicators */}
                        <div>
                          <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-2.5">Key Indicators Found</h4>
                          <div className="grid md:grid-cols-2 gap-3">
                            {selectedReport.ai_summary.key_findings.map((f: any, i: number) => (
                              <div key={i} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-xl">
                                <div>
                                  <div className="text-white text-xs font-bold">{f.parameter}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">Value: {f.value}</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                  f.status === "High"
                                    ? "bg-red-500/15 text-red-400 border border-red-500/20"
                                    : f.status === "Low"
                                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                }`}>
                                  {f.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recommendations */}
                        <div>
                          <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-2">Doctor Recommendations</h4>
                          <ul className="space-y-2">
                            {selectedReport.ai_summary.recommendations.map((rec: string, i: number) => (
                              <li key={i} className="text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed">
                                <span className="text-blue-500 mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"></span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Follow up tag */}
                        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                          selectedReport.ai_summary.follow_up_required
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-400 glow-warning"
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 glow-success"
                        }`}>
                          {selectedReport.ai_summary.follow_up_required ? (
                            <>
                              <AlertTriangle className="h-5 w-5" />
                              <div className="text-xs font-bold">
                                Medical Follow-up Required: Schedule a specialist appointment using our find clinician search tool.
                              </div>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-5 w-5" />
                              <div className="text-xs font-bold">
                                Healthy Record Status: No clinical doctor consultation immediately required.
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col justify-center items-center text-slate-500 gap-2">
                        <FileText className="h-10 w-10 opacity-30 text-blue-500" />
                        <span className="text-sm font-semibold">Select a PDF report or upload a new panel file.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Live Queue Tracker */}
            {activeTab === "queue" && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">Live Queue Tracker</h2>
                  <p className="text-slate-400 text-sm mt-1">Real-time status updates of your today's scheduled medical queues.</p>
                </div>

                {queueStatus ? (
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    {/* Ring meter layout */}
                    <div className="glass-panel p-8 rounded-3xl flex flex-col items-center gap-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-blue-500/5 w-32 h-32 rounded-full blur-3xl"></div>
                      <div className="text-center">
                        <h3 className="text-white text-lg font-bold">{queueStatus.doctor_name}</h3>
                        <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Active Queue Tracker</span>
                      </div>

                      {/* Queue Circle */}
                      <div className="h-44 w-44 rounded-full border-[8px] border-slate-800 flex flex-col justify-center items-center relative glow-primary bg-slate-950/20">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Call</div>
                        <div className="text-4xl font-extrabold text-blue-500 my-1">{queueStatus.active_token || "—"}</div>
                        <div className="text-[9px] text-slate-400 font-semibold bg-white/5 px-2 py-0.5 rounded-full">
                          Your Token: {queueStatus.patient_token || "None"}
                        </div>
                      </div>

                      <div className="w-full grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="bg-white/5 border border-white/5 p-3 rounded-2xl">
                          <span className="text-slate-400 block mb-1">Queue Status</span>
                          <span className="text-emerald-400 font-bold uppercase tracking-wider">{queueStatus.doctor_status}</span>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-3 rounded-2xl">
                          <span className="text-slate-400 block mb-1">Total Waiting</span>
                          <span className="text-white font-bold">{queueStatus.queue_length} Patients</span>
                        </div>
                      </div>
                    </div>

                    {/* Estimations block */}
                    <div className="glass-panel p-6 rounded-2xl space-y-6">
                      <div>
                        <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Queue Prediction Panel</span>
                        <h3 className="text-white text-xl font-extrabold mt-1">Live Wait Estimator</h3>
                      </div>

                      <div className="p-4 bg-blue-500/10 border border-blue-500/25 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-300 font-semibold">Estimated Waiting Time</span>
                          <div className="text-2xl font-black text-blue-400 mt-1">
                            {queueStatus.estimated_waiting_time_minutes} Mins
                          </div>
                        </div>
                        <Clock className="h-10 w-10 text-blue-500 animate-pulse" />
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Queue estimators adjust predictions dynamically whenever emergency priority schedules (Urgency 3) are loaded at the front of today's schedule lists.
                      </p>

                      <button
                        onClick={refreshQueue}
                        className="w-full py-2.5 bg-slate-900 border border-white/10 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex justify-center items-center gap-2"
                      >
                        Refresh Queue Status
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel p-12 rounded-3xl text-center text-slate-500 flex flex-col items-center gap-3">
                    <Clock className="h-12 w-12 opacity-25 text-blue-500" />
                    <h3 className="text-white font-bold text-base">No Queue Available</h3>
                    <p className="text-xs max-w-sm mx-auto leading-relaxed">
                      You don't have any appointments scheduled for today. Book an appointment and log in during consult slots to monitor the queue meter.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Appointments */}
            {activeTab === "appointments" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">My Medical Bookings</h2>
                  <p className="text-slate-400 text-sm mt-1">Track schedules, download prescriptions, and check booking statuses.</p>
                </div>

                <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
                  {appointments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 font-bold border-b border-white/5">
                            <th className="p-4">Doctor & Speciality</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Slot</th>
                            <th className="p-4">Urgency</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Prescription</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {appointments.map((appt) => (
                            <tr key={appt.id} className="hover:bg-white/5 text-slate-300">
                              <td className="p-4">
                                <div className="font-bold text-white">Dr. Clinician</div>
                                <div className="text-[10px] text-blue-400 font-medium">Slot ID: {appt.id.substring(0, 8)}</div>
                              </td>
                              <td className="p-4 font-semibold">{appt.appointment_date}</td>
                              <td className="p-4 font-semibold">{appt.slot_label}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                                  appt.urgency_level === 3
                                    ? "bg-red-500/10 border border-red-500/20 text-red-400"
                                    : appt.urgency_level === 2
                                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                                    : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                                }`}>
                                  {appt.urgency_level === 3 ? "Emergency" : appt.urgency_level === 2 ? "Urgent" : "Normal"}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold capitalize ${
                                  appt.status === "approved" || appt.status === "completed"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : appt.status === "pending"
                                    ? "bg-blue-500/10 text-blue-400"
                                    : "bg-red-500/10 text-red-400"
                                }`}>
                                  {appt.status}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                {appt.prescription ? (
                                  <button
                                    onClick={() => alert(`Prescription:\n\n${appt.prescription}`)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded"
                                  >
                                    View Prescription
                                  </button>
                                ) : (
                                  <span className="text-slate-500 font-medium text-[10px]">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 py-12 italic">
                      No appointment bookings registered.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
