# MedConnect AI - Smart Appointment Booking & Diagnostics System

MedConnect AI is a production-ready, AI-powered patient booking and diagnostic analysis system designed to optimize clinic management and patient workflows. It leverages **Next.js 15**, **FastAPI**, **Gemini API**, and core **Data Structures & Algorithms (DSA)** to eliminate wait times and automate diagnostic insights.

---

## Technical Stack

*   **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts
*   **Backend**: FastAPI, SQLAlchemy, SQLite (default fallback) / PostgreSQL (production)
*   **AI Models**: Gemini API (`gemini-1.5-flash`)
*   **Authentication**: JWT (JSON Web Tokens) with direct `bcrypt` password hashing
*   **Dependencies**: `pypdf` for PDF parsing, `pytest` for unit testing

---

## ⚡ DSA Integration Highlights

The platform integrates fundamental computer science algorithms directly into business logic:

1.  **Priority Queue (Min-Heap)**: Manages today's clinical patient lists. Push records ordered by `(-urgency_level, appointment_time)`. This ensures emergency cases (Priority 3) automatically leapfrog to the top of the doctor's queue, while chronologically maintaining first-come-first-served order for same-priority slots.
2.  **Interval Scheduling (Greedy Choice)**: Implements conflict checking for booking. Rejects requests that overlap with existing appointments using the condition `Proposed Start < Existing End AND Existing Start < Proposed End`. The backend also includes a greedy scheduler sorted by end times to find the maximum possible compatible consultation intervals.
3.  **Binary Search ($O(\log N)$)**: Searches sorted availability intervals to find the first open doctor consultation slot starting at or after a specified user target time.
4.  **Trie (Prefix Trees)**: Indexes doctors by lowercase prefixes of their names and specialities. When a patient types in the search bar, the Trie returns prefix matching doctor IDs in $O(L)$ time, where $L$ is the prefix length, powering instant autocomplete suggestions.
5.  **Graph (Breadth-First Search)**: Models doctor collaboration and referral paths. Nodes represent doctors, and edges represent hospital partnerships or cross-specialty references. BFS traverses the graph from a starting doctor node to recommend similar clinicians or target specialists within their trusted network.

---

## 📂 File Architecture

```text
├── backend/
│   ├── app/
│   │   ├── dsa/
│   │   │   ├── binary_search.py       # Slot binary search
│   │   │   ├── graph.py               # Doctor referral graphs
│   │   │   ├── interval_scheduling.py  # Slot overlap prevention
│   │   │   ├── priority_queue.py      # Patient queue heap
│   │   │   └── trie.py                # Autocomplete search prefix
│   │   ├── routers/
│   │   │   ├── ai.py                  # Gemini symptom analyzer
│   │   │   ├── appointments.py        # Bookings & Queue management
│   │   │   ├── auth.py                # JWT registration & profiles
│   │   │   ├── doctors.py             # Autocomplete & details
│   │   │   └── reports.py             # PDF uploader + Gemini parser
│   │   ├── auth.py                    # Token verification & bcrypt
│   │   ├── config.py                  # Pydantic settings loading
│   │   ├── database.py                # Database engine setup
│   │   ├── main.py                    # FastAPI entrypoint & CORS
│   │   ├── models.py                  # SQLAlchemy schema definitions
│   │   ├── schemas.py                 # Pydantic validation structures
│   │   └── seed.py                    # Mock database generator script
│   ├── tests/
│   │   └── test_dsa.py                # Unit tests for algorithms
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/dashboard/       # Recharts counters & staff rosters
│   │   │   ├── doctor/dashboard/      # Token updates, queue, prescriptions
│   │   │   ├── patient/dashboard/     # Symptoms checker, booker, reports hub
│   │   │   ├── login/                 # Glassmorphism credentials card
│   │   │   ├── register/              # Role selector registration
│   │   │   ├── globals.css            # Tailwind configurations
│   │   │   ├── layout.tsx             # Root template & Meta headers
│   │   │   └── page.tsx               # Mesh landing page & Trie search
│   │   └── lib/
│   │       └── api.ts                 # Typed fetch client to FastAPI
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml                 # Orchestration setup
└── README.md                          # Documentation
```

---

## 🚀 Setup & Execution Guide

### Option 1: Running Locally (Fastest Setup)

This mode runs the backend using SQLite without requiring PostgreSQL.

#### 1. Setup Backend
1.  Navigate to the project root and create a Python virtual environment:
    ```bash
    python -m venv venv
    venv\Scripts\activate      # Windows
    source venv/bin/activate   # macOS/Linux
    ```
2.  Install dependencies:
    ```bash
    pip install -r backend/requirements.txt
    ```
3.  Set your environmental variables in a `.env` file inside `backend/` (or set them directly in your shell):
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    ```
    *(Note: If no API key is supplied, a smart fallback system simulates symptom checker and PDF report analyses based on local keywords so the app remains fully functional).*
4.  Seed the database with comprehensive mock doctors, slots, and pending priority queues:
    ```bash
    python -m backend.app.seed
    ```
5.  Run the FastAPI development server:
    ```bash
    uvicorn backend.app.main:app --reload
    ```
    *FastAPI will start running at [http://localhost:8000](http://localhost:8000). You can check the interactive Swagger documentation at `/docs`.*

#### 2. Run Backend Unit Tests
To verify all five DSA components (Trie, Priority Queue, Graphs, Binary Search, Interval Scheduling), run:
```bash
pytest backend/tests/
```

#### 3. Setup Frontend
1.  Navigate to the `frontend/` folder:
    ```bash
    cd frontend
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Launch Next.js development server:
    ```bash
    npm run dev
    ```
    *Next.js will start running at [http://localhost:3000](http://localhost:3000).*

---

### Option 2: Running via Docker (Production Mode)

This mode deploys PostgreSQL as the primary database alongside the backend and frontend services.

1.  Make sure Docker is running on your system.
2.  In the root directory, create a `.env` file to provide your credentials:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    ```
3.  Build and run containers using Docker Compose:
    ```bash
    docker-compose up --build
    ```
4.  Once running:
    *   **Frontend**: [http://localhost:3000](http://localhost:3000)
    *   **Backend**: [http://localhost:8000](http://localhost:8000)
    *   **DB (Postgres)**: Running internally on port 5432.

---

## 🔒 Test Credentials

Log in with any of these pre-seeded accounts using password `patient123` or `doctor123`:

*   **Admin**: `admin@medconnect.ai` (Password: `admin123`)
*   **General Physician**: `dr.sharma@medconnect.ai` (Password: `doctor123`)
*   **Cardiologist**: `dr.gupta@medconnect.ai` (Password: `doctor123`)
*   **Patient (Normal)**: `rohan@medconnect.ai` (Password: `patient123`)
*   **Patient (Emergency)**: `simran@medconnect.ai` (Password: `patient123`)
