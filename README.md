# CCA DocTrack – Student Document Request Tracking System

> **Institution**: Christ Centered Academy of Lipa City Inc. (CCA)  
> **Course**: IT 412 Platform Technologies  
> **Project Type**: Final Academic Project  
> **System Name**: CCA DocTrack  
> **Database Architecture**: Supabase Cloud Database (PostgreSQL) via `@supabase/supabase-js`  
> **Cloud Platform**: Render Web Services  
> **Live Production Web App**: [https://cca-doctrack.onrender.com](https://cca-doctrack.onrender.com)  

---

## Project Overview

**CCA DocTrack** is a cloud-based student document request and administrative tracking platform. It streamlines student document submissions, real-time registrar evaluations, automated audit logging, and document release workflows.

The system satisfies all technical competencies of **IT 412 Platform Technologies**:
1. **Interactive Multi-Portal Architecture**: Unified institutional portal with high-contrast CCA branding (Navy Blue `#002D62`, Royal Blue `#2563EB`, Crimson Red `#DC2626`), featuring dedicated Student and Registrar Administrator portals.
2. **Cloud PostgreSQL Database**: Persistent cloud storage powered by **Supabase PostgreSQL** via `@supabase/supabase-js`, leveraging Row-Level Security (RLS) and parameterized queries to guarantee bulletproof protection against SQL injection.
3. **Automated Schema Provisioning & Self-Healing**: Automatically provisions relational tables (`users`, `document_requests`, `reactivation_requests`) and performance indexes on startup, while preserving existing administrative and student records without destructive overwrites.
4. **Unified Authentication & Security Controls**: Unified single login form, strict institutional email domain enforcement (`@cca.edu.ph`), password strength standards (8+ characters, uppercase, lowercase, numbers), and public administrator creation blocking (HTTP 403 Forbidden).
5. **Data Privacy & Student Request Isolation**: Complete student record isolation ensuring students only see and manage their own submissions. Cross-user access is strictly blocked at the API layer.
6. **In-Place Updates & Cascading Deletions**: User profile modifications update existing records in-place without generating duplicate entries. Account deletion cascades automatically across all linked requests, reactivations, and audit logs.
7. **Mobile-First Responsive Engineering**: Fluid responsive interface with off-canvas hamburger navigation drawer, vertical profile layout, centered confirmation dialogs, and elimination of horizontal scrolling across all mobile and desktop viewport sizes.
8. **Production-Ready Cloud Deployment**: Deployed on **Render** with health monitoring (`/api/health`), zero-downtime restarts, and Git environment variable exclusion safeguards (`.gitignore`).

---

## Key Features & Capabilities

### 1. Unified Single Login & Authentication
* **Single Sign-In Form**: Removed confusing multi-step tabs or manual portal selectors. Students and administrators log in from the same clean interface using either their **Institutional Email** or **Student ID Number**.
* **Automatic Role Redirection**: The server automatically verifies credentials in Supabase and directs users to their authorized workspace (Student Portal vs. Registrar Administrator Portal).
* **Strict Institutional Email Verification**: Registration requires an official `@cca.edu.ph` institutional email address (e.g., `student@cca.edu.ph`). Non-institutional domains are rejected with clear error guidance.
* **Standardized Password Security Policy**: Universal policy across registration and password changes:
  * Minimum 8 characters (supports arbitrarily long passwords >= 12 characters).
  * Requires at least one uppercase letter (`A-Z`).
  * Requires at least one lowercase letter (`a-z`).
  * Requires at least one numerical digit (`0-9`).
  * Supports optional special characters.
* **Admin Privilege Escalation Protection**: Public registration is strictly restricted to students. Any attempt to register an administrative role via public endpoints is blocked (`403 Forbidden`).

### 2. Student Privacy & Request Isolation
* **Strict Ownership Enforcement**: Students only see requests submitted under their own authenticated account.
* **Zero Request Leakage for New Accounts**: Newly registered student accounts start with a clean state (0 requests).
* **Cross-User Protection**: Direct API queries targeting another student's document request are rejected with `403 Forbidden`.

### 3. In-Place Updates & Cascade Deletion
* **In-Place Record Modification**: Updating student or administrator names, emails, or courses updates the affected row directly in Supabase without creating redundant duplicate rows. Changes propagate immediately across all historical document requests.
* **Cascade Deletion**: When an administrator deletes a student account, the system cascades the deletion in both Supabase and the active session, deleting all associated:
  * Document requests (`document_requests`)
  * Account reactivation requests (`reactivation_requests`)
  * Cached profile avatars and local records

### 4. Full Mobile Responsiveness & Drawer Navigation
* **Off-Canvas Navigation Drawer**: On tablet and mobile devices (<= 768px), navigation collapses into a smooth off-canvas drawer triggered by a touch-friendly hamburger button.
* **Clean Drawer Profile Header**: Displays user avatar on the left, full name on the top line, role on the second line, and the "• Online" status badge underneath with ample clearance preventing overlap with the `✕` close button.
* **Centered Logout Experience**: Centered logout action button with leave icon in the mobile navigation drawer and a centered confirmation dialog modal.
* **Zero Horizontal Scrollbar**: Enforced `max-width: 100vw` and `overflow-x: hidden` preventing awkward sideways scrolling.

### 5. Multi-Document Request Lifecycle
* **Supported Official Documents**:
  * Transcript of Records (TOR)
  * Certificate of Enrollment (COE)
  * Good Moral Certificate
  * Report Card / Form 137
  * Certificate of Graduation
  * Certified True Copy (CTC)
  * Others (customizable request purpose)
* **Real-Time Status Progression**: `Pending` &rarr; `Processing` &rarr; `Approved` / `For Release` &rarr; `Completed` (or `Rejected`).
* **Registrar Evaluation Controls**: Administrators can approve, reject, schedule pickup dates, add evaluation notes, and export official reports to PDF with CCA registrar branding.

---

## Technology Stack

| Layer | Technology | Details & Purpose |
|---|---|---|
| **Frontend** | HTML5, CSS3, Modern JavaScript (ES6+) | Institutional single-page UI, responsive drawers, modal dialogs, live filtering |
| **Backend** | Node.js (>=18.0.0), Express.js (v4.x) | Parameterized REST API routing, CORS handling, authentication middleware |
| **Database** | Supabase Cloud Database (PostgreSQL) | Scalable PostgreSQL database with Row-Level Security (RLS) |
| **Database Client**| `@supabase/supabase-js` (v2.x) | Official Supabase JavaScript SDK |
| **Password Security**| `bcryptjs` (v3.x) | 10 salt rounds cryptographic password hashing |
| **Cloud Hosting** | Render Web Services | Cloud PaaS deployment with automatic CI/CD deployment from GitHub |
| **Version Control**| Git & GitHub | Distributed version control with sensitive file protection (`.gitignore`) |

---

## Database Schema Specification (Supabase PostgreSQL)

The database schema is defined in [`supabase_schema.sql`](file:///c:/Users/alyan/cca-doctrack/supabase_schema.sql) and auto-provisioned upon server startup in [`db.js`](file:///c:/Users/alyan/cca-doctrack/db.js):

### 1. `users` Table
```sql
CREATE TABLE IF NOT EXISTS public.users (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    full_name TEXT NOT NULL,
    student_id TEXT DEFAULT '',
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    course TEXT DEFAULT 'BS Information Technology',
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'deactivated')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON public.users(student_id);
```

### 2. `document_requests` Table
```sql
CREATE TABLE IF NOT EXISTS public.document_requests (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    document_type TEXT NOT NULL,
    purpose TEXT NOT NULL,
    date_submitted DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Approved', 'For Release', 'Completed', 'Rejected')),
    course TEXT DEFAULT 'BS Information Technology',
    email TEXT DEFAULT '',
    pickup_date TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_requests_student_id ON public.document_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_document_requests_status ON public.document_requests(status);
CREATE INDEX IF NOT EXISTS idx_document_requests_created_at ON public.document_requests(created_at DESC);
```

### 3. `reactivation_requests` Table
```sql
CREATE TABLE IF NOT EXISTS public.reactivation_requests (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reactivation_requests_student_id ON public.reactivation_requests(student_id);
```

---

## Project Directory Structure

```text
cca-doctrack/
├── public/
│   ├── index.html                           # Multi-portal institutional interface (Landing, Student, Admin)
│   ├── style.css                            # CCA branding (Navy, Royal Blue, Crimson) & responsive design
│   ├── script.js                            # Frontend application state, API fetch client, and modal handlers
│   └── logo.png                             # Official Christ Centered Academy seal
├── routes/
│   ├── requestRoutes.js                     # REST endpoints for student document requests
│   └── authRoutes.js                        # REST endpoints for authentication, profile, and student management
├── data/
│   └── avatars.json                         # Persistent avatar storage
├── db.js                                    # Supabase client initialization, queries, and auto-seeding
├── server.js                                # Express server setup, middleware, health check, and routing
├── supabase_schema.sql                      # Complete Supabase PostgreSQL schema with RLS policies
├── test_system.js                           # Comprehensive system, auth, isolation, and security test suite
├── test_http_endpoints.js                   # REST API status code and validation test suite
├── .env                                     # Environment variables (excluded from Git)
├── .env.example                             # Environment configuration template
├── .gitignore                               # Excludes node_modules, .env, and sensitive files
├── package.json                             # Dependencies (@supabase/supabase-js, express, bcryptjs)
└── README.md                                # Comprehensive system documentation
```

---

## Environment Configuration

Create or update your `.env` file in the project root:

```ini
PORT=3000

# Supabase Cloud Database Configuration
SUPABASE_URL=https://your-supabase-project-id.supabase.co
SUPABASE_SECRET_KEY=your-supabase-service-role-secret-key

# Optional Initial Seed Password Overrides (Local Development / Demo Only)
# DEFAULT_ADMIN_PASSWORD=your_custom_admin_password
# DEFAULT_STUDENT_PASSWORD=your_custom_student_password
```

> [!WARNING]
> **Production Security**: Do NOT set or publish default passwords (`admin123`, `student123`) as environment variables on live production hosts. Default seed credentials are for initial local development and academic evaluation only. On live deployments, update passwords immediately upon first login.

> [!IMPORTANT]
> The backend communicates with Supabase using the `SUPABASE_SECRET_KEY` (service role key), which securely bypasses client-side RLS to perform administrative evaluations and user management securely on the server. Never expose this key in client-side code!

---

## ▶Running & Testing Locally

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 2. Installation
```bash
git clone https://github.com/jynllnmgpnty/cca-doctrack.git
cd cca-doctrack
npm install
```

### 3. Run Automated Verification Test Suites
Execute the clean automated test suites:
```bash
# Test 1: Comprehensive System Integration, Security Policies, Auth & Isolation Tests
npm test
# or
node test_system.js

# Test 2: Standard HTTP Endpoints & REST Status Code Validation Tests
npm run test:endpoints
# or
node test_http_endpoints.js
```

### 4. Start the Application
- **Development Mode** (auto-restart with nodemon):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

### 5. Access the Web Application
Open your browser to:
```text
http://localhost:3000
```
---

## REST API Reference

All requests and responses use JSON format (`Content-Type: application/json`).

### 1. System Health Check
- **Endpoint**: `GET /api/health`
- **Status Codes**: `200 OK` (Connected), `503 Service Unavailable` (Disconnected)
- **Response**:
  ```json
  {
    "status": "UP",
    "service": "CCA DocTrack API",
    "uptime": "120s",
    "database": {
      "status": "Connected",
      "type": "Supabase Database (PostgreSQL)",
      "mode": "Supabase Cloud Database"
    },
    "timestamp": "2026-11-28T14:00:00.000Z"
  }
  ```

### 2. Authentication & User Management
- **Unified Login**: `POST /api/auth/login`
  - Accepts `{ email, password }` (email can be email address or Student ID number).
  - Automatically returns authorized user role and profile details.
- **Student Registration**: `POST /api/auth/register`
  - Enforces `@cca.edu.ph` email, 8+ character password, and blocks `role=admin`.
- **Get Profile**: `GET /api/auth/profile?identifier=<email|studentId|id>&role=<student|admin>`
- **Update Profile In-Place**: `PATCH /api/auth/profile`
- **Change Password**: `POST /api/auth/change-password`
- **Save Profile Avatar**: `POST /api/auth/avatar`
- **Get All Registered Students**: `GET /api/auth/students` (Admin only)
- **Cascade Delete Student**: `DELETE /api/auth/students/:identifier` (Cascades to requests and reactivations)

### 3. Document Requests
- **List Requests**: `GET /api/requests`
  - Optional filter: `?studentId=<id>` (Enforces ownership isolation)
- **Submit Request**: `POST /api/requests`
- **Get Single Request**: `GET /api/requests/:id`
- **Update Request Status**: `PATCH /api/requests/:id` (Admin only)
- **Delete Request**: `DELETE /api/requests/:id`

---

## Deploying to Render (PaaS)

The application is deployed live on **Render**. To deploy your own instance:

1. **Push Repository to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy CCA DocTrack to Render"
   git push origin main
   ```
2. **Create New Web Service on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com) &rarr; **New +** &rarr; **Web Service**.
   - Connect repository: `https://github.com/jynllnmgpnty/cca-doctrack`.
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`
3. **Configure Environment Variables**:
   - `PORT`: `10000` *(or dynamic port provided by Render)*
   - `SUPABASE_URL`: `https://your-supabase-project-id.supabase.co`
   - `SUPABASE_SECRET_KEY`: `your-supabase-service-role-secret-key`

> [!CAUTION]
> Do NOT set or publish default demo passwords (`admin123`, `student123`) as Render environment variables. Default credentials must be treated as demo-only and changed on any live deployed site.

4. **Deploy**:
   - Click **Deploy Web Service**.
   - Your live URL is active at `https://cca-doctrack.onrender.com`.

---

## Security & Integrity Highlights

- **SQL Injection Immunization**: All database transactions execute via Supabase's parameterized query builder.
- **Cryptographic Security**: Passwords salted and hashed with `bcryptjs` (10 rounds). Plaintext passwords are never stored.
- **Row-Level Security (RLS)**: Enforced on Supabase PostgreSQL tables; public anonymous access to password hashes is completely denied.
- **Privilege Separation**: Public registration cannot grant administrative roles.
- **Student Data Privacy**: Strict ownership verification prevents any user from snooping on or tampering with another student's document submissions.
- **Cascade Cleanliness**: Removing an account automatically cleans up all associated records, preventing orphaned database artifacts.
