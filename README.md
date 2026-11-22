# CCA DocTrack – Student Document Request Tracking System

> **Institution**: Christ Centered Academy of Lipa City Inc. (CCA)  
> **Course**: IT 412 Platform Technologies  
> **Project Type**: Final Academic Project  
> **System Name**: CCA DocTrack  
> **Database Architecture**: Turso Cloud Database (libSQL / SQLite) via `@libsql/client`  
> **Cloud Platform**: Render Web Services  

---

## 📌 Project Overview

**CCA DocTrack** is a cloud-based web application engineered for **Christ Centered Academy of Lipa City Inc. (CCA)** to streamline the submission, live tracking, and administrative processing of official student academic documents (Report Cards, Certificates of Enrollment, Good Moral Certificates, and Transcripts of Records).

The system fulfills all academic specifications of **IT 412 Platform Technologies**:
1. **Interactive Multi-Portal Frontend**: Institutional single-page application with high-contrast CCA branding (Navy Blue `#002D62`, Golden Yellow `#F59E0B`, Crimson Red `#DC2626`), featuring dedicated Student and Registrar Administrator portals.
2. **Cloud Database Architecture**: Persistent SQL data storage powered by **Turso Cloud Database (libSQL / SQLite)** using `@libsql/client` with parameterized queries to prevent SQL injection.
3. **Automated Schema Provisioning**: The server automatically initializes SQL tables (`document_requests`, `users`) on startup and seeds default accounts if they do not exist.
4. **RESTful API**: Standards-compliant endpoints (`GET`, `POST`, `PATCH`, `GET :id`, `/health`) adhering to strict HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).
5. **Seamless Local & Cloud Hybrid Support**: Runs effortlessly with remote Turso Cloud credentials or falls back gracefully to a local SQLite database (`file:cca_doctrack.db`) for local testing.
6. **Deployment-Ready**: Preconfigured for immediate zero-downtime deployment to **Render** with `.env` exclusion safeguards.

---

## 🚀 Technology Stack

| Layer | Technology | Details & Purpose |
|---|---|---|
| **Frontend** | HTML5, CSS3, Modern JavaScript (ES6+) | Institutional portal UI, dynamic multi-step stepper, live table filtering |
| **Backend** | Node.js (>=18.0.0), Express.js (v4.x) | Parameterized REST API routing, CORS handling, static serving |
| **Database** | Turso Cloud Database (libSQL / SQLite) | Distributed cloud SQLite database engine with ultra-low latency |
| **Database Client**| `@libsql/client` | Official libSQL/SQLite SDK for Node.js |
| **Authentication** | `bcryptjs` | Salting and hashing for administrative and student user passwords |
| **Cloud Hosting** | Render Web Services | Production PaaS deployment |
| **Version Control**| Git & GitHub | Source tracking with sensitive file exclusion (`.gitignore`) |

---

## 🗄️ Database Schema Specification

The application automatically creates the required tables on server launch:

### 1. `document_requests` Table
```sql
CREATE TABLE IF NOT EXISTS document_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  document_type TEXT NOT NULL,
  purpose TEXT NOT NULL,
  date_submitted TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  course TEXT DEFAULT 'BS Information Technology',
  email TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. `users` Table (Authentication & Portals)
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  student_id TEXT DEFAULT '',
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  course TEXT DEFAULT 'BS Information Technology',
  role TEXT DEFAULT 'student',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📁 Project Directory Structure

```text
cca-doctrack/
├── public/
│   ├── index.html              # Multi-portal UI (Landing, Student Portal, Registrar Admin Portal)
│   ├── style.css               # Official CCA branding (Navy Blue, Yellow, Red) & responsive design
│   ├── script.js               # Client fetch logic, DOM state, live search, and modal handling
│   └── logo.png                # Official Christ Centered Academy seal
├── routes/
│   ├── requestRoutes.js        # Parameterized SQL endpoints for student document requests
│   └── authRoutes.js           # Parameterized SQL endpoints for authentication & registration
├── db.js                       # Reusable Turso database connection & auto-migration module
├── server.js                   # Express application entrypoint, middleware, and health route
├── test_migration.js           # Verification test suite for database and business logic
├── test_http_endpoints.js      # Integration test suite for HTTP API status codes and responses
├── .env                        # Local environment variables (excluded from Git)
├── .env.example                # Environment configuration template
├── .gitignore                  # Excludes node_modules, .env, .env.*, *.db
├── package.json                # Project dependencies (@libsql/client, express, bcryptjs)
└── README.md                   # Complete system and deployment documentation
```

---

## 🛠️ Turso Cloud Database Setup Guide

Follow these steps to connect your CCA DocTrack system to **Turso Cloud**:

### Option A: Using the Turso CLI

1. **Install the Turso CLI**:
   - **Windows (PowerShell)**:
     ```powershell
     irm https://get.tur.so/install.ps1 | iex
     ```
   - **macOS / Linux**:
     ```bash
     curl -sSfL https://get.tur.so/install.sh | bash
     ```

2. **Sign In or Sign Up**:
   ```bash
   turso auth signup
   # or
   turso auth login
   ```

3. **Create the Database**:
   ```bash
   turso db create cca-doctrack
   ```

4. **Retrieve Database URL**:
   ```bash
   turso db show cca-doctrack --url
   ```
   *Example output*: `libsql://cca-doctrack-your-username.turso.io`

5. **Generate an Authentication Token**:
   ```bash
   turso db tokens create cca-doctrack
   ```
   *Copy the generated JWT token string.*

### Option B: Using the Turso Web Console
1. Visit [turso.tech](https://turso.tech) and log in.
2. Click **Create Database** and name it `cca-doctrack`.
3. Select your closest region (e.g., Tokyo or Singapore).
4. Under the database details, copy the **Database URL** (`libsql://...`).
5. Click **Generate Token** and copy the **Auth Token**.

---

## ⚙️ Environment Configuration

1. In the project root, create or edit your `.env` file:
   ```ini
   PORT=3000

   # Turso Cloud Database credentials
   TURSO_DATABASE_URL=libsql://cca-doctrack-your-username.turso.io
   TURSO_AUTH_TOKEN=your_generated_turso_auth_token_here
   ```

> [!NOTE]
> **Offline / Local Fallback**: If `TURSO_DATABASE_URL` is empty, unset, or set to the placeholder string, the application automatically uses a local SQLite database file (`file:cca_doctrack.db`). You can immediately develop and test without creating an external account!

---

## ▶️ Running & Testing the Application Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Verification Tests
Run the comprehensive Turso migration and HTTP API test suites:
```bash
# Test 1: Verify SQL schema, queries, data persistence, and statistics
node test_migration.js

# Test 2: Verify full HTTP endpoints, status codes, and error validations
node test_http_endpoints.js
```

### 3. Start the Server
- **Development Mode** (auto-reload via nodemon):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

### 4. Access the Web Application
Open your browser to:
```text
http://localhost:3000
```

### 5. Default Demonstration Accounts
| Portal | Email | Password | Role |
|---|---|---|---|
| **Registrar Admin Portal** | `admin@cca.edu.ph` | `admin123` | Administrator |
| **Student Portal** | `jaynellan@cca.edu.ph` | `student123` | Student |

---

## 📡 REST API Reference

All requests and responses use JSON (`Content-Type: application/json`).

### 1. System Health Check
- **Endpoint**: `GET /api/health`
- **Status Codes**: `200 OK` (Healthy), `503 Service Unavailable` (DB offline)
- **Sample Response**:
  ```json
  {
    "status": "UP",
    "service": "CCA DocTrack API",
    "uptime": "42s",
    "database": {
      "status": "Connected",
      "type": "Turso Cloud Database (libSQL)",
      "mode": "Remote Turso Cloud",
      "description": "Connected to Remote Turso Cloud"
    },
    "timestamp": "2026-11-22T07:45:00.000Z"
  }
  ```

### 2. Retrieve Document Requests
- **Endpoint**: `GET /api/requests`
- **Query Parameters**: `?studentId=<id>` (optional filter)
- **Status Codes**: `200 OK`, `500 Internal Server Error`
- **Sample Response**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "_id": "1",
        "id": 1,
        "studentName": "Jaynellan Almary O. Magpantay",
        "studentId": "23-67894",
        "documentType": "Transcript of Records",
        "purpose": "Scholarship Application Requirement",
        "dateSubmitted": "2026-11-20",
        "status": "Processing",
        "course": "BS Information Technology",
        "email": "jaynellan@cca.edu.ph",
        "createdAt": "2026-11-20 08:00:00"
      }
    ]
  }
  ```

### 3. Submit Document Request
- **Endpoint**: `POST /api/requests`
- **Status Codes**: `201 Created`, `400 Bad Request`, `500 Internal Server Error`
- **Payload**:
  ```json
  {
    "studentName": "Maria Santos",
    "studentId": "23-10045",
    "course": "BS Information Technology",
    "documentType": "Certificate of Enrollment",
    "purpose": "CHED Scholarship Renewal",
    "dateSubmitted": "2026-11-22",
    "email": "msantos@cca.edu.ph"
  }
  ```

### 4. Retrieve Single Request by ID
- **Endpoint**: `GET /api/requests/:id`
- **Status Codes**: `200 OK`, `400 Bad Request` (invalid ID), `404 Not Found`

### 5. Update Request Status (Admin)
- **Endpoint**: `PATCH /api/requests/:id`
- **Status Codes**: `200 OK`, `400 Bad Request` (invalid status), `404 Not Found`
- **Payload**:
  ```json
  {
    "status": "Completed"
  }
  ```
- *Allowed Statuses*: `Pending`, `Processing`, `Completed`

### 6. Authentication Endpoints
- **Register Account**: `POST /api/auth/register` (`201 Created`, `400 Bad Request`)
- **Login**: `POST /api/auth/login` (`200 OK`, `401 Unauthorized`, `403 Forbidden`)

---

## 🌐 Deploying to Render (PaaS)

When you are ready to deploy to Render:

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Migrate CCA DocTrack database to Turso Cloud (libSQL)"
git push origin main
```

### Step 2: Configure Web Service on Render
1. Go to [dashboard.render.com](https://dashboard.render.com) and click **New +** &rarr; **Web Service**.
2. Select your repository `https://github.com/jynllnmgpnty/cca-doctrack`.
3. Provide the service configuration:
   - **Name**: `cca-doctrack`
   - **Environment**: `Node`
   - **Region**: Closest region (e.g., Singapore)
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
4. Expand **Environment Variables** and add:
   - `PORT`: `10000` *(Render provides this dynamically, but `server.js` listens to `process.env.PORT`)*
   - `TURSO_DATABASE_URL`: `libsql://your-database-name-your-org.turso.io`
   - `TURSO_AUTH_TOKEN`: `your_turso_auth_token`
5. Click **Deploy Web Service**.
6. Once deployed, Render provides your live URL (e.g. `https://cca-doctrack.onrender.com`).

---

## 🛡️ Security & Integrity Highlights

- **SQL Injection Prevention**: All queries use parameterized inputs (`db.execute({ sql: '...', args: [...] })`).
- **Credential Protection**: Database URLs and tokens are never hardcoded and are ignored by Git via `.gitignore`.
- **Password Salting & Hashing**: All user passwords stored in Turso are hashed with bcrypt (10 salt rounds).
- **Graceful Error Handling**: Full validation for bad status codes and malformed request formats.
