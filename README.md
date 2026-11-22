# CCA DocTrack – Cloud-Based Student Document Request Tracking System

> **Course**: IT 412 Platform Technologies  
> **Project Type**: Final Academic Project  
> **System Name**: CCA DocTrack  
> **Author**: Senior Full-Stack Web Development Team  

---

## 📌 Project Overview

**CCA DocTrack** is a cloud-based web application engineered to streamline the submission, tracking, and management of student academic document requests (e.g., Report Cards, Certificates of Enrollment, Good Moral Certificates, and Transcripts of Records).

The system addresses the academic criteria of **IT 412 Platform Technologies**:
1. **Dynamic Web Application Development**: Clean single-page architecture built with HTML5, CSS3, and vanilla JavaScript communicating with an Express.js REST API.
2. **Cloud Database Integration**: Persistent NoSQL data storage using **MongoDB Atlas** with Mongoose ODM.
3. **RESTful API Implementation**: Full support for standard HTTP methods (`GET`, `POST`, `PATCH`), appropriate status codes (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `503 Service Unavailable`), and defensive input validation.
4. **Platform as a Service (PaaS) Deployment**: Designed to deploy natively to **Render Web Services** using standard Node environment variables.
5. **Version Control**: Modular repository structure ready for GitHub integration.

---

## 🚀 Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | HTML5, Modern CSS3, JavaScript (ES6+) | Responsive dashboard, dynamic form validation, real-time status management |
| **Backend** | Node.js, Express.js | REST API routing, CORS handling, business logic, static file serving |
| **Database ODM** | Mongoose (v8.x) | Data modeling, schema-level validation, type casting |
| **Cloud Database** | MongoDB Atlas (M0 Free Tier) | Cloud database cluster for persistent document records |
| **PaaS Host** | Render | Production cloud hosting |
| **Version Control**| Git & GitHub | Source code tracking and automated CI/CD deployment |

---

## 📁 Project Directory Structure

```text
cca-doctrack/
├── public/
│   ├── index.html          # Dashboard structure, forms, tables, metric cards
│   ├── style.css           # Blue, white, light-gray institutional theme & responsive layout
│   └── script.js           # Client-side API fetch client, state management, validations
├── models/
│   └── Request.js          # Mongoose schema for student document requests
├── routes/
│   └── requestRoutes.js    # Express REST API routes (GET, POST, PATCH, GET :id)
├── .env                    # Environment variables (PORT, MONGODB_URI) [Do NOT commit!]
├── .gitignore              # Ignores node_modules, .env, and sensitive files
├── package.json            # Project manifest, dependencies, and execution scripts
├── README.md               # Complete setup, testing, and deployment manual
└── server.js               # Express application entry point & MongoDB Atlas connector
```

---

## 🛠️ Installation & Local Setup

### Step 1: Clone or Navigate to the Workspace
Open your terminal (PowerShell or Bash) and change into the project directory:
```bash
cd c:\Users\alyan\cca-doctrack
```

### Step 2: Install Project Dependencies
Run `npm install` to install Express, Mongoose, Dotenv, and CORS:
```bash
npm install
```

---

## ☁️ MongoDB Atlas Configuration Guide

To store requests persistently across browser refreshes, configure a free MongoDB Atlas database cluster:

### 1. Create a Free MongoDB Atlas Account
1. Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign up or log in.
2. Create a new organization or project named **IT412-CCA-DocTrack**.

### 2. Deploy a Free Shared Database Cluster
1. Click **Create** under Clusters.
2. Select **M0 Free (Shared)**.
3. Choose your nearest cloud provider region (e.g., AWS / Singapore or AWS / Tokyo for Southeast Asia).
4. Name your cluster (e.g., `Cluster0`) and click **Create Deployment**.

### 3. Configure Database User Credentials
1. In the left navigation menu under **Security**, click **Database Access**.
2. Click **Add New Database User**.
3. Choose **Password** authentication method.
4. Enter a username (e.g., `ccadoctrack_admin`).
5. Enter a secure password (avoid special characters like `@`, `:`, `/` in the password to prevent URI parsing errors, or URL-encode them).
6. Under **Database User Privileges**, select **Built-in Role: Read and write to any database**.
7. Click **Add User**.

### 4. Configure Network Access (IP Whitelist)
1. In the left navigation menu under **Security**, click **Network Access**.
2. Click **Add IP Address**.
3. Choose **Allow Access from Anywhere** (`0.0.0.0/0`) or add your current IP.
   *(Note: `0.0.0.0/0` is required for Render cloud deployment because Render uses dynamic IP addresses).*
4. Click **Confirm**.

### 5. Obtain Your MongoDB Connection String
1. In the left menu, click **Database** (under Deployments).
2. Click the **Connect** button next to your cluster.
3. Select **Drivers** (Node.js).
4. Copy the connection string. It will look like this:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Specify the database name by appending `cca_doctrack` right before `?retryWrites=true`:
   ```text
   mongodb+srv://ccadoctrack_admin:YourPassword123@cluster0.xxxxx.mongodb.net/cca_doctrack?retryWrites=true&w=majority
   ```

### 6. Update Your `.env` File
Open the `.env` file in the root of `cca-doctrack` and paste your actual connection string:
```ini
PORT=3000
MONGODB_URI=mongodb+srv://ccadoctrack_admin:YourPassword123@cluster0.xxxxx.mongodb.net/cca_doctrack?retryWrites=true&w=majority
```

---

## ▶️ Running the Application Locally

### Development Mode (with automatic restart on code change):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

### Accessing the Web Application
Open your browser and navigate to:
```text
http://localhost:3000
```
- Observe the **Cloud DB** status badge in the bottom-left sidebar.
- When successfully connected, the indicator turns **green** and displays **Atlas Connected**.

---

## 📡 REST API Specification

### Base URL: `http://localhost:3000/api`

| Endpoint | Method | Status | Description |
|---|---|---|---|
| `/health` | `GET` | `200` | Checks API and MongoDB Atlas connection status |
| `/requests` | `GET` | `200` | Retrieves all student requests sorted by newest first |
| `/requests` | `POST` | `201`, `400` | Creates a new request (validates required fields) |
| `/requests/:id` | `GET` | `200`, `404`, `400` | Retrieves a single request by its MongoDB `_id` |
| `/requests/:id` | `PATCH` | `200`, `404`, `400` | Updates status (`Pending`, `Processing`, `Completed`) |

---

## 🧪 Testing the API Endpoints

You can verify the backend endpoints using **PowerShell**, **cURL**, or **Postman**.

### 1. Test Health-Check
**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method Get
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/health
```

---

### 2. Submit a New Document Request (POST /api/requests)
**PowerShell:**
```powershell
$body = @{
    studentName = "Juan Dela Cruz"
    studentId = "2022-00451"
    documentType = "Certificate of Enrollment"
    purpose = "CHED Scholarship Application requirement"
    dateSubmitted = "2026-11-22"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/requests" -Method Post -Body $body -ContentType "application/json"
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"studentName":"Juan Dela Cruz","studentId":"2022-00451","documentType":"Certificate of Enrollment","purpose":"CHED Scholarship Application requirement","dateSubmitted":"2026-11-22"}'
```

**Expected Response (`HTTP 201 Created`):**
```json
{
  "success": true,
  "message": "Document request created successfully.",
  "data": {
    "_id": "6740608fa8...",
    "studentName": "Juan Dela Cruz",
    "studentId": "2022-00451",
    "documentType": "Certificate of Enrollment",
    "purpose": "CHED Scholarship Application requirement",
    "status": "Pending",
    "dateSubmitted": "2026-11-22T00:00:00.000Z"
  }
}
```

---

### 3. Retrieve All Requests (GET /api/requests)
**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/requests" -Method Get
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/requests
```

---

### 4. Update Request Status (PATCH /api/requests/:id)
Replace `<REQUEST_ID>` with the `_id` returned from the POST request:
**PowerShell:**
```powershell
$patchBody = @{
    status = "Processing"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/requests/<REQUEST_ID>" -Method Patch -Body $patchBody -ContentType "application/json"
```

**cURL:**
```bash
curl -X PATCH http://localhost:3000/api/requests/<REQUEST_ID> \
  -H "Content-Type: application/json" \
  -d '{"status":"Processing"}'
```

**Expected Response (`HTTP 200 OK`):**
```json
{
  "success": true,
  "message": "Request status successfully updated to 'Processing'.",
  "data": {
    "_id": "<REQUEST_ID>",
    "status": "Processing"
  }
}
```

---

## 🌐 Deploying to Render (PaaS)

When ready to publish for your IT 412 presentation:

### Step 1: Push Code to GitHub
1. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: CCA DocTrack student document tracking system"
   ```
2. Create a new repository on your GitHub account (e.g., `cca-doctrack`).
3. Link and push your repository:
   ```bash
   git remote add origin https://github.com/<your-username>/cca-doctrack.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Create Web Service on Render
1. Log in to [render.com](https://render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and choose the `cca-doctrack` repository.
4. Fill in the deployment settings:
   - **Name**: `cca-doctrack`
   - **Environment**: `Node`
   - **Region**: Choose the closest region (e.g., Singapore)
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`
5. Click **Advanced** &rarr; **Add Environment Variable**:
   - `MONGODB_URI`: *Paste your MongoDB Atlas connection string*
   - `PORT`: `10000` *(Render sets this automatically, but you can leave Express to read `process.env.PORT`)*
6. Click **Deploy Web Service**.
7. Render will build and deploy the app. Once active, your live public URL will be displayed (e.g., `https://cca-doctrack.onrender.com`).

---

## 🛡️ Academic Compliance Notes

- **Data Persistence**: All records reside securely in MongoDB Atlas; reloading the page re-fetches the live collection via `GET /api/requests`.
- **Validation**: Strict boundary checks enforce student names, valid IDs, recognized document types, and non-empty purposes.
- **Security**: The `.env` file containing database credentials is excluded from version control via `.gitignore`.
