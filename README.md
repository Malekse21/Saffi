# Saffi: Healthcare Queue and Practice Management Platform

Saffi is a real-time, offline-resilient queue and practice management web application engineered for medical practices, clinics, and healthcare providers. It streamlines patient check-ins, waiting room flow, appointment scheduling, and operational analytics through a synchronized ecosystem connecting doctors, medical secretaries, waiting room displays, and patient mobile devices.

---

## Executive Summary

Medical practices frequently suffer from chaotic waiting rooms, patient anxiety due to unpredictable wait times, manual queue tracking errors, and workflow disruptions caused by internet instability.

Saffi addresses these challenges by delivering an end-to-end management solution featuring:

- Real-Time Queue Synchronization: Instant updates across practitioner dashboards, reception desks, waiting room TV displays, and patient mobile web portals via Supabase Realtime subscriptions.
- Offline-First Architecture: Uninterrupted operation during network outages with local storage caching and automatic background re-synchronization.
- Multi-Role Workspaces: Specialized interfaces tailored for Doctors, Secretaries, Patients, and Public Waiting Room Displays.
- Patient Self-Service Ecosystem: Mobile ticket tracking via QR code scanning, reducing waiting room density and phone inquiries.
- Practice Analytics: Operational metrics on patient throughput, average wait times, peak activity periods, and appointment retention.

---

## Technical Stack

### Frontend & Application Framework
- Next.js 16 (App Router, Server and Client Components, Dynamic Routes)
- React 19 and TypeScript 5 (Strict type checking and interface contracts)
- Tailwind CSS v4 (Modern utility-first styling system)
- Lucide React (Iconography library)

### State Management & Interactive UI
- Framer Motion (Declarative animations and layout transitions)
- dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`) (Drag-and-drop queue prioritization)
- Sonner (Toast notification management)
- React Hook Form (Form validation and state handling)

### Database, Authentication & Realtime Storage
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`) (PostgreSQL, Row Level Security, Realtime WebSockets, SSR Auth)

### Offline Resilience & Utilities
- Custom Offline Synchronization Engine (IndexedDB/LocalStorage caching with queued mutation replay)
- Progressive Web App (PWA) manifest configuration

### Data Processing & Export Tools
- Recharts (Interactive analytical visual charts)
- jsPDF and html2canvas (PDF medical report generation)
- html5-qrcode and qrcode.react (QR code scanning and generation)
- XLSX (Excel import and export capabilities)

---

## Key Platform Features

### 1. Doctor and Secretary Dashboard
- Smart Queue Board: Categorize patients by walk-in, appointment, or emergency priority.
- One-Click Controls: Actions to call next patient, flag away status, or mark consultations complete.
- Drag-and-Drop Management: Reorder waitlist order on the fly.
- Integrated Patient Records: Track patient consultation history, motives, and visit notes.

### 2. Connected Waiting Room TV Display
- Automated Screen Updates: Dedicated `/tv` view presenting current token number, patient status, and upcoming queue.
- Multi-Modal Notifications: Integrated Text-to-Speech (TTS) audio chime and voice announcements when calling patients.
- Privacy Safeguards: Configurable privacy settings to switch between full names and anonymized ticket numbers.
- Information Banner: Designated zone for clinic announcements or health guidelines.

### 3. Patient Mobile Portal
- Remote Live Queue Tracker: Patients scan a generated QR code to monitor their position live from their smartphones.
- Visual Turn Notifications: High-visibility screen alerts when a patient is called to the consultation cabinet.
- Self-Service Appointment Booking: Direct portal flow for scheduling follow-up visits.

### 4. Self Check-In & Scanner Station
- Kiosk Mode: Public QR generation screen for walk-in patient registration.
- Integrated QR Reader: Hardware camera scanning for receptionists to verify patient tickets instantly.

### 5. Practice Analytics & Management
- Operations Insights: Visual graphs detailing wait time distributions, daily patient volume, and peak hours.
- Data Portability: Import existing patient lists via CSV/Excel and export daily queue summaries to PDF or XLSX.
- Custom Clinic Branding: Configurable clinic headers, logos, and TV themes.

---

## System Architecture & Data Flow

```
+-----------------------------------------------------------------------+
|                            Client Layer                               |
|  +-------------------+  +-------------------+  +-------------------+  |
|  | Doctor/Secretary  |  | Waiting Room TV   |  | Patient Mobile    |  |
|  | Dashboard         |  | Display           |  | Web Portal        |  |
|  +---------+---------+  +---------+---------+  +---------+---------+  |
+------------|----------------------|----------------------|------------+
             |                      |                      |
             v                      v                      v
+-----------------------------------------------------------------------+
|                     Next.js 16 Application Server                      |
|                  App Router & Middleware Control                      |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                    Supabase Cloud Backend Services                    |
|  +-------------------+  +-------------------+  +-------------------+  |
|  | PostgreSQL DB     |  | Realtime Channel  |  | Row Level         |  |
|  | Engine            |  | WebSockets        |  | Security (RLS)    |  |
|  +-------------------+  +-------------------+  +-------------------+  |
+-----------------------------------------------------------------------+
```

---

## Security & Data Protection Measures

- Environment Variable Isolation: All API keys, connection strings, and sensitive credentials are isolated in server-side and environment variables. Secrets are excluded from version control via `.gitignore`.
- Row Level Security (RLS): Database tables utilize Supabase RLS policies to restrict read, update, and write permissions based on authenticated user IDs and user roles.
- Sanitized Client Exposures: Public client bundles only expose `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, both protected by database RLS rules.
- Confidentiality Controls: Public display modules include optional privacy toggles to mask patient names in public areas.

---

## Environment Variables & Configuration

This project requires environment variables for Supabase integration. A `.env.example` file is included in the root directory to serve as a template.

### Setting Up Environment Variables

1. Copy `.env.example` to create `.env.local`:

```bash
cp .env.example .env.local
```

2. Populate `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-supabase-anon-key
```

Note: Never commit `.env`, `.env.local`, or any file containing secret API keys to public repositories. The `.gitignore` configuration explicitly excludes `.env*` files while allowing `.env.example`.

---

## Database Schemas & Setup

Database SQL migrations and schema initialization files are available in the project root:

- `settings_schema.sql`: Table structure and defaults for clinic settings and configurations.
- `feedback_schema.sql`: Table schema for patient feedback and review gates.
- `recall_migration.sql`: Migrations for patient follow-up and recall tracking.
- `db_updates.sql`: Database extensions and index definitions.

To initialize your database:
1. Open your Supabase SQL Editor.
2. Execute `settings_schema.sql`, followed by `feedback_schema.sql` and `db_updates.sql`.
3. Enable Realtime on the `patients` and `queue` tables.

---

## Project Structure

```
Saffi/
├── app/                      # Next.js App Router pages and API endpoints
│   ├── api/                  # Backend API routes
│   ├── auth/                 # Authentication route handlers
│   ├── client-portal/        # Patient mobile tracking portal
│   ├── dashboard/            # Doctor & Secretary management dashboard
│   ├── join/                 # Patient self check-in page
│   ├── login/                # Authentication login view
│   ├── register/             # User registration view
│   ├── scanner/              # QR ticket scanner page
│   ├── tv/                   # Waiting room public display screen
│   ├── layout.tsx            # Root layout provider
│   └── page.tsx              # Landing page
├── components/               # Reusable UI component modules
│   ├── dashboard/            # Dashboard specific components
│   ├── landing/              # Landing page sections
│   ├── patient/              # Patient view cards and trackers
│   ├── pwa/                  # PWA installation and service worker components
│   ├── ExcelImporter.tsx     # Bulk patient import interface
│   ├── PatientCard.tsx       # Queue patient item component
│   └── FlipQueueCard.tsx     # Interactive animated queue item
├── lib/                      # Core business logic and offline utilities
│   ├── analytics.ts          # Operational metrics calculations
│   ├── offline-sync.ts       # Offline sync engine and queue management
│   ├── patients.ts           # Patient database abstraction layer
│   └── specialties.ts        # Practice specialization configurations
├── utils/                    # Supabase client, server, and middleware helpers
│   └── supabase/             # SSR and client Supabase factories
├── public/                   # Static assets, branding icons, audio files
├── .env.example              # Template for environment variables
├── .gitignore                # Git exclusion specifications
├── package.json              # Project dependencies and operational scripts
└── tsconfig.json             # TypeScript engine configuration
```

---

## Getting Started

### Prerequisites

- Node.js version 18.17 or higher
- npm, yarn, pnpm, or bun package manager
- A Supabase account and active project

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/saffi.concat
cd saffi
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables as described in the Environment Variables section.

4. Launch the local development server:

```bash
npm run dev
```

5. Access the application:
- Main Landing & Login: http://localhost:3000
- Practitioner Dashboard: http://localhost:3000/dashboard
- Waiting Room Display: http://localhost:3000/tv
- Patient Portal: http://localhost:3000/client-portal

---

## Verification & Available Scripts

In the project directory, you can run:

- `npm run dev`: Starts the Next.js development server with hot-reloading.
- `npm run build`: Compiles and optimizes the application for production deployment.
- `npm run start`: Starts the Next.js production server.
- `npm run lint`: Executes ESLint code quality and syntax checks.

---

## License & Contact

This project is released under the MIT License. For inquiries, feedback, or professional opportunities, please contact the repository maintainer.
