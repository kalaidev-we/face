# FaceTrack AI — AI Facial Recognition Attendance Management System

FaceTrack AI is a premium, enterprise-grade Facial Recognition Attendance Management System built with a SaaS-grade UI inspired by Vercel and Linear. 

The application utilizes browser-side TensorFlow.js (`face-api.js`) to capture 10-sample facial descriptors and averages them into a 128-dimensional biometric template vector. This vector is matched in under 50ms using cosine-similarity queries against Supabase PostgreSQL `pgvector` tables (or a browser-based local dot-product vector fallback engine).

---

## 🚀 Key Features

- **Biometric Face Enrollment:** Guided 10-sample enrollment modal that checks head positions, lighting levels, focus sharpness, and aggregates descriptors into a single average centroid template.
- **Diagnostics Check:** Real-time diagnostics overlay rendering alignment indicators, blur variances, luminance checks, and motion liveness anti-spoofing indicators.
- **Geofencing Lock:** Restricts check-ins using the browser Geolocation API, blocking scans if the terminal lies outside campus borders.
- **Backup QR Attendance:** Dynamic time-based token QR backup generator for device scan fallbacks.
- **Enterprise Hierarchy:** Structural control tables linking Campus Branches, Departments, and Class cohorts.
- **ML Analytics:** Linear regression forecast percentage for next-week attendance and dropout risk warning panels.
- **Reporting Module:** Live filters compiling tabular summaries with custom CSV/Excel downloads and printable report worksheets.
- **System Audit Shell:** A retro-themed scrolling shell trail rendering real-time audit logs of database syncs, registrations, and status check-ins.
- **Zero-Setup Mock Mode:** Dynamically falls back to a browser LocalStorage database seed with 30 days of pre-populated history if live Supabase variables are absent.

---

## 🛠 Tech Stack

- **Frontend:** React + TypeScript + Zustand (State) + React Router v7
- **UI Framework:** Tailwind CSS v4 + Lucide Icons + Recharts
- **Biometric Core:** `@vladmandic/face-api` (client-side TensorFlow wrapper)
- **Database Backend:** Supabase PostgreSQL + `pgvector` extension (Vector similarity matching)
- **Notifications:** Sonner Toast

---

## 📁 Project Directory Structure

```
face/
├── schema.sql              # Database schema setup, RPC functions, and RLS policies
├── index.html              # App entry HTML with premium typography & SEO tags
├── vite.config.ts          # Vite configuration with @tailwindcss/vite plugin
├── package.json            # Script commands and dependencies declarations
├── src/
│   ├── main.tsx            # DOM initialization entry point
│   ├── App.tsx             # Route declarations & Sonner toast context
│   ├── index.css           # Global Tailwind directives, glassmorphic tokens & animations
│   ├── lib/
│   │   ├── supabaseClient.ts # Dynamic credentials client manager
│   │   ├── db.ts           # Unified local storage & Supabase API gateway
│   │   └── faceDetector.ts # Face-api model loaders and image checkers
│   ├── store/
│   │   └── useStore.ts     # Global Zustand store for session, camera, and theme states
│   └── pages/
│       ├── LandingPage.tsx # Product landing view with interactive scanner demo
│       ├── Login.tsx       # Auth controller with OTP & Google simulation modes
│       ├── DashboardLayout.tsx # Sidebar panel with global search popover
│       ├── Overview.tsx    # KPI dashboards with live auto-refresh checks
│       ├── AttendanceMarking.tsx # Camera scan viewport with liveness diagnosis
│       ├── Students.tsx    # registry table and 10-sample enroll camera modal
│       ├── Staff.tsx       # Admin panel managing handler credentials
│       ├── Departments.tsx # Hierarchy manager editing classes/branches
│       ├── Analytics.tsx   # Recharts trend areas and ML risk predictors
│       ├── Reports.tsx     # CSV download compiler and print layout sheets
│       └── Settings.tsx    # Supabase credentials loader and audit trail console
```

---

## 💻 Local Setup & Development

### 1. Install Dependencies
Clone the repository and install packages:
```bash
npm install
```

### 2. Run Locally
Start the development server:
```bash
npm run dev
```
Open the localhost address in your web browser.

### 3. Build for Production
Verify typescript compilation and compile assets:
```bash
npm run build
```

---

## 🔌 Connecting to Supabase (Live Database)

To connect the application to a live backend database:

1. Create a project in your **Supabase Console**.
2. Go to the **SQL Editor** and execute the contents of the [schema.sql](file:///h:/Arise/face/schema.sql) file. This will enable `pgvector`, set up tables, create performance indexes, and set up Row-Level Security (RLS) policies.
3. Open the **Storage** page and create two public buckets:
   - `student-photos` (Allows public select and authenticated inserts)
   - `attendance-snaps` (Allows public select and authenticated inserts)
4. Go to **Settings** -> **API** to copy your Project URL and Anon API key.
5. In the FaceTrack AI app, log in as `admin@facetrack.ai`, navigate to **Settings**, paste your credentials under the **Supabase Database Integration** section, and click **Connect Live Database**.
6. The application will instantly switch from Mock Local Mode to your live Supabase database!

---

## 👥 Mock Mode Account Credentials

If you do not have a Supabase instance set up, you can log in instantly in **Mock Mode** using the following pre-seeded logins:

- **Super Admin:** `admin@facetrack.ai` (Full dashboard view, system settings access, logs terminal)
- **Staff Handler:** `sarah.jenkins@facetrack.ai` (Registry management, live scanning terminal access)
- **Student Profile:** `alex.mercer@facetrack.ai` (Personal metrics charts, date history, individual print card)

*Note: For the mock mode login screen, you can leave the password field blank or enter any characters.*
