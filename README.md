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

### Prerequisites
- Node.js 18+ and npm
- Git
- Modern web browser with camera access support

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/face.git
cd face
npm install
```

### 2. Environment Configuration
Copy the environment template and add your Supabase credentials:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Security Note:** Never commit `.env.local` to version control. It's already in `.gitignore`.

### 3. Development Server
Start the local development server:
```bash
npm run dev
```
Open `http://localhost:5173` (or the URL shown in terminal) in your browser.

### 4. Linting & Type Checking
Verify code quality before committing:
```bash
npm run lint
npm run build  # Verifies TypeScript compilation
```

### 5. Production Build
Create an optimized production bundle:
```bash
npm run build
npm run preview  # Test production build locally
```

---

## 🔌 Connecting to Supabase (Live Database)

To connect the application to a live backend database:

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Save your Project URL and Anon API key from Settings → API

2. **Setup Environment Variables**
   - Update `.env.local` with your credentials (see section above)

3. **Initialize Database Schema**
   - Go to your Supabase **SQL Editor** and execute the contents of [schema.sql](schema.sql)
   - This will enable `pgvector`, create tables, indexes, and RLS policies

4. **Create Storage Buckets**
   - In Supabase **Storage**, create these public buckets:
     - `student-photos` — for enrolled face images
     - `attendance-snaps` — for attendance verification snapshots

5. **Verify Connection**
   - Restart your dev server: `npm run dev`
   - Check browser console for any connection errors
   - Navigate to Settings page to verify Supabase connection

---

## 📋 Available Scripts

- `npm run dev` — Start development server with hot reload
- `npm run build` — Build for production (includes TypeScript check)
- `npm run lint` — Run ESLint to check code quality
- `npm run preview` — Preview production build locally

---

## 🔒 Security Best Practices

- **Never commit credentials:** Always use `.env.local` for sensitive data
- **Use RLS Policies:** Database is protected with Row-Level Security (see schema.sql)
- **Validate User Input:** All form inputs are validated before database operations
- **CORS Configuration:** Configure Supabase CORS settings for your domain
- **Rate Limiting:** Consider implementing rate limiting on API endpoints for production

---

## 👥 Mock Mode Account Credentials

If you do not have a Supabase instance set up, you can log in instantly in **Mock Mode** using:

- **Super Admin:** `admin@facetrack.ai` (Full dashboard, system settings, audit logs)
- **Staff Handler:** `sarah.jenkins@facetrack.ai` (Registry management, scanning access)
- **Student:** `alex.mercer@facetrack.ai` (Personal metrics, attendance history)

*Password field can be left blank in mock mode.*

---

## 🐛 Troubleshooting

### App shows "Failed to load face detection models"
- Check internet connection (models load from CDN)
- Clear browser cache and refresh
- Try a different browser if issue persists

### Camera not working
- Ensure browser has camera permissions
- Check that you're using HTTPS (or localhost) for camera access
- Try reloading the page

### Supabase connection fails
- Verify `.env.local` has correct URL and key
- Check that Supabase project is active
- Confirm network connectivity to Supabase

### TypeScript errors on build
- Run `npm install` to ensure all dependencies are installed
- Check that your `node_modules` directory wasn't corrupted
- Try deleting `node_modules` and running `npm install` again

---

## 📦 Deployment

### Deploy to Vercel (Recommended)
```bash
npm run build
# Push to GitHub, then connect to Vercel for automatic deployments
```

### Deploy to Other Platforms
- Ensure `npm run build` completes without errors
- Set environment variables on your hosting platform
- Point to the `dist` directory as the build output

---

## 📝 License

This project is proprietary and confidential.

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
