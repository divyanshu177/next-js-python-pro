const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Helper to get token
const getAuthHeader = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  return {};
};

// Generic fetch wrapper
async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "An unknown error occurred" }));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  // Authentication
  auth: {
    async register(data: any) {
      return request("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    async login(data: any) {
      // Use JSON login
      return request("/auth/login/json", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    async getProfile() {
      return request("/auth/profile");
    },
    async updateProfile(data: any) {
      return request("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
  },

  // Doctors
  doctors: {
    async list(filters: { specialization?: string; min_rating?: number; min_experience?: number; hospital?: string; query?: string } = {}) {
      const params = new URLSearchParams();
      if (filters.specialization) params.append("specialization", filters.specialization);
      if (filters.min_rating) params.append("min_rating", filters.min_rating.toString());
      if (filters.min_experience) params.append("min_experience", filters.min_experience.toString());
      if (filters.hospital) params.append("hospital", filters.hospital);
      if (filters.query) params.append("query", filters.query);

      const queryString = params.toString() ? `?${params.toString()}` : "";
      return request(`/doctors${queryString}`);
    },
    async autocomplete(q: string) {
      return request(`/doctors/autocomplete?q=${encodeURIComponent(q)}`);
    },
    async get(id: string) {
      return request(`/doctors/${id}`);
    },
    async getRecommendations(id: string) {
      return request(`/doctors/${id}/recommendations`);
    },
  },

  // Appointments
  appointments: {
    async book(data: { doctor_id: string; appointment_date: string; start_time: string; end_time: string; slot_label: string; urgency_level: number; symptoms_description?: string }) {
      return request("/appointments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    async list() {
      return request("/appointments");
    },
    async getTodayPrioritized() {
      return request("/appointments/today");
    },
    async update(id: string, data: { status?: string; prescription?: string; appointment_date?: string; start_time?: string; end_time?: string; slot_label?: string }) {
      return request(`/appointments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    async getQueueStatus(doctorId: string) {
      return request(`/appointments/queue/${doctorId}`);
    },
  },

  // Reports
  reports: {
    async upload(file: File) {
      const formData = new FormData();
      formData.append("file", file);
      
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: any = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}/reports/upload`, {
        method: "POST",
        body: formData,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to upload report" }));
        throw new Error(errorData.detail || "Failed to upload report");
      }
      return response.json();
    },
    async list() {
      return request("/reports");
    },
  },

  // AI Symptom Checker
  ai: {
    async checkSymptoms(symptoms: string) {
      return request("/ai/symptoms", {
        method: "POST",
        body: JSON.stringify({ symptoms }),
      });
    },
  },
};
