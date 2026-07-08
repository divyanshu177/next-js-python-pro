# 🏥 MedConnect AI

MedConnect AI is a premium, AI-powered Medical Appointment Booking & Patient Diagnostics System. It features intelligent specialist recommendations, diagnostic report scanning, and wait time estimations built using optimized computer science algorithms (Trie, Heap PQ, Graph BFS, Interval Scheduling, Binary Search).

---

## 🚀 Quick Start Guide

Follow these steps to clone the repository and launch the services locally in less than 5 minutes.

### 📋 Prerequisites
Make sure you have the following installed on your system:
*   **Python 3.12+**
*   **Node.js 18+** & **npm**
*   **MongoDB** (Local instance running on port `27017` OR a MongoDB Atlas Cloud account)
*   *(Optional)* **Docker Desktop** (if running via Docker Compose)

---

## 🛠️ Step 1: Clone the Repository & Configure Env

Open your terminal and clone the repository:
```bash
git clone https://github.com/divyanshu177/next-js-python-pro.git
cd next-js-python-pro
```

Create a `.env` file at the **root directory** of the cloned repository:
```bash
# Windows (PowerShell)
New-Item .env

# macOS / Linux
touch .env
```

Open `.env` and add your configuration parameters:
```env
# Database URI (Use local MongoDB or replace with your MongoDB Atlas cluster URI)
MONGO_URI=mongodb://localhost:27017
MONGO_DB=medconnect

# Gemini API Key (For AI symptoms checker and blood report scans)
# Leave blank to automatically fallback to local keyword matching
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🐍 Step 2: Set up the Backend (FastAPI)

1.  **Navigate to the root directory** and create a Python virtual environment:
    ```bash
    # Windows
    python -m venv venv
    venv\Scripts\activate

    # macOS / Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

2.  **Install dependencies**:
    ```bash
    pip install -r backend/requirements.txt
    ```

3.  **Seed mock database clinical records**:
    Make sure your local MongoDB service is running (or Atlas is whitelisted) and execute:
    ```bash
    python -m backend.app.seed
    ```

4.  **Launch the Backend server**:
    ```bash
    uvicorn backend.app.main:app --reload --port 8000
    ```
    *FastAPI will launch at [http://localhost:8000](http://localhost:8000). Interactive Swagger API docs are available at `/docs`.*

---

## 🎨 Step 3: Set up the Frontend (Next.js 15)

1.  **Open a new terminal window**, navigate to the `frontend/` directory, and install packages:
    ```bash
    cd frontend
    npm install
    ```

2.  **Launch the client development server**:
    ```bash
    npm run dev
    ```
    *Next.js will compile and launch the portal on [http://localhost:3000](http://localhost:3000).*

---

## 🐳 Step 4 (Alternative): Launch via Docker Compose

To spin up MongoDB database container, backend, and frontend altogether, navigate to the project root and run:
```bash
docker-compose up --build
```
*Port mappings: Frontend (3000), Backend (8000), MongoDB (27017).*

---

## 🔑 Test Credentials

Log in using the pre-seeded accounts configured during database initialization (default passwords configured below):

*   **Admin Dashboard** (Analytics, Revenue graphs):
    *   **Email**: `admin@medconnect.ai` (Password: `admin123`)
*   **Doctor Terminal** (Consultation hubs, min-heap urgent queues):
    *   **Email**: `dr.sharma@medconnect.ai` (Password: `doctor123`)
*   **Patient Portal** (AI symptoms checkers, PDF report summaries):
    *   **Email**: `rohan@medconnect.ai` (Password: `patient123`)
    *   **Email**: `simran@medconnect.ai` (Password: `patient123`)

---

## 🧠 Behind the Scenes: Data Structures & Algorithms (DSA)

The system leverages five specialized algorithms to handle high-concurrency healthcare logistics:
1.  **Trie (Prefix Trees)**: Powers case-insensitive search autocompletes for doctor names/specialities in $O(L)$ time.
2.  **Priority Queue (Min-Heap)**: Re-orders today's appointments dynamically, sorting by `(-urgency_level, appointment_time)` to place Emergency patients at the top of the doctor queue.
3.  **Interval Scheduling (Conflict Prevention)**: Checks proposed slot boundaries to prevent overlapping bookings.
4.  **Binary Search ($O(\log N)$)**: Searches sorted slots to instantly find the nearest slot on or after a patient's preferred target time.
5.  **Graph BFS (Referrals Network)**: Traverses doctor and hospital partnership nodes to suggest collaborative specialists in the same hospital or related fields.
