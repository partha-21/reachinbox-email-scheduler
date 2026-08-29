# ReachInbox - Full-Stack Email Job Scheduler

Production-grade full-stack email outreach scheduler built with React, TypeScript, Express, PostgreSQL / SQLite (Prisma), BullMQ, Redis, Nodemailer (Real-Time Production SMTP & Ethereal Fallback), Elasticsearch, Google OAuth, and Slack Integration.

---

## 🏗️ Architecture

```
                          ┌────────────────────────┐
                          │   React 18 + Vite UI   │
                          │ (Tailwind, TS, Axios)  │
                          └───────────┬────────────┘
                                      │ REST API / Auth Session
                                      ▼
                          ┌────────────────────────────────────────┐
                          │ Single Merged Node.js Express App      │
                          │ (REST API + BullMQ Queue + Slack Sync) │
                          └─┬──────┬──────┬────────────────────────┘
                            │      │      │
          ┌─────────────────┘      │      └─────────────────┐
          ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Database (Prisma)│    │ Redis / In-Mem   │    │ SMTP Transport   │
│ - Users          │    │ - BullMQ Queue   │    │ - Live Real-Time │
│ - Campaigns      │    │ - Sliding Limit  │    │   (Gmail/Custom) │
│ - Scheduled Jobs │    └──────────────────┘    │ - Ethereal Preview│
└──────────────────┘                            └──────────────────┘
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router v6, Axios
- **Backend**: Node.js, Express.js, TypeScript, Passport.js
- **Database & ORM**: PostgreSQL / SQLite, Prisma ORM
- **Queue & Rate Limiting**: BullMQ 5, Redis 7 (ioredis & redis-memory-server fallback)
- **Email Delivery**: Nodemailer (Real-Time SMTP for live delivery + Ethereal SMTP sandbox fallback)
- **Search Engine**: Elasticsearch 8.8 (`@elastic/elasticsearch`)
- **Integrations**: Google OAuth 2.0, Slack Web API (`@slack/web-api`)
- **Live Dashboard**: BullBoard (`@bull-board/express`)
- **Deployment**: Render Free Tier (Native Node.js & Static Web Services)

---

## 📁 Monorepo Folder Structure

```
reachinbox-email-scheduler/
├── render.yaml
├── .env.example
├── README.md
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── scripts/
│   │   ├── load-test.ts
│   │   ├── rate-limit-test.ts
│   │   └── restart-test.ts
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── elasticsearch.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── email.controller.ts
│   │   │   └── slack.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── queues/
│   │   │   └── email.queue.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── email.routes.ts
│   │   │   └── slack.routes.ts
│   │   ├── services/
│   │   │   ├── email.service.ts
│   │   │   ├── ethereal.service.ts
│   │   │   ├── elasticsearch.service.ts
│   │   │   ├── slack.service.ts
│   │   │   └── rateLimiter.service.ts
│   │   ├── workers/
│   │   │   └── email.worker.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.tsx
    │   │   ├── EmailRow.tsx
    │   │   └── SendLaterModal.tsx
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── ScheduledPage.tsx
    │   │   ├── SentPage.tsx
    │   │   ├── EmailDetailPage.tsx
    │   │   └── ComposePage.tsx
    │   ├── services/
    │   │   └── api.ts
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    ├── tailwind.config.js
    └── tsconfig.json
```

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js (v18+ or v20+)

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Live Real-Time SMTP Configuration (Optional)
To send real emails to live receiver inboxes, specify your SMTP server in `.env`:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_SECURE=false
```
*Note: If `SMTP_HOST` is omitted, the application automatically falls back to Ethereal SMTP test previews.*

### 3. Backend Setup & Migrations
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

The backend server will start on `http://localhost:5000`.
BullMQ Live Dashboard is accessible at `http://localhost:5000/admin/queues`.

### 4. Frontend Startup
```bash
cd ../frontend
npm install
npm run dev
```
The React frontend application will launch on `http://localhost:5173`.

---

## 🚀 Deploying to Render Free Tier

Render's free tier rejects web services deployed using Docker containers. This repository is configured to deploy seamlessly on Render's **Free Tier Native Runtimes**:

1. **Push your repository** to GitHub.
2. In Render, select **New Blueprint Instance** and point to your GitHub repo (it will read `render.yaml`).
3. Alternatively, create two Web Services on Render manually:
   - **Backend Web Service**: Select runtime **Node** (Build Command: `cd backend && npm install && npm run build`, Start Command: `cd backend && npm start`).
   - **Frontend Static Site**: Select runtime **Static** (Build Command: `cd frontend && npm install && npm run build`, Publish directory: `./frontend/dist`).

---

## 🔑 OAuth Setup Details

### Google OAuth 2.0
1. Create a project in the Google Cloud Console.
2. Configure OAuth consent screen and add Redirect URI: `http://localhost:5000/api/auth/google/callback`.
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.
4. *Dev Quick Login*: On the login screen, a developer sign-in button is provided for instant testing without OAuth keys.

### Slack OAuth Integration
1. Create a Slack App in api.slack.com.
2. Add Bot Scopes: `chat:write`, `chat:write.public`, `channels:read`, `incoming-webhook`.
3. Set Redirect URI: `http://localhost:5000/api/slack/callback`.
4. Set `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` in `.env`.
5. Connect your workspace via the Slack widget in the app sidebar.

---

## ⚙️ Core Technical Capabilities

### 1. Redis Sliding Window Rate Limiting
- Evaluated per sender (`rate_limit:sender:{email}`).
- Uses atomic Redis Sorted Sets (ZSET) to track execution timestamps within a 1-hour window.
- If `MAX_EMAILS_PER_HOUR_PER_SENDER` is exceeded:
  - Calculates the exact millisecond offset when the next window opens.
  - Automatically delays/reschedules the job in BullMQ without dropping emails.
  - Sends a real Slack alert notification if the user has connected Slack.

### 2. Idempotency Engine
- Unique `idempotencyKey` formatted per email (`idemp:${userId}:${campaignId}:${recipient}:${index}`).
- Worker verifies DB status before dispatching. If status is already `SENT`, job completes instantly without duplicate dispatches.

### 3. Server Restart Persistence & Unified Process
- BullMQ delayed jobs are persisted in Redis (or auto-started in-memory Redis).
- Background workers and REST API endpoints run merged within the same Node process for zero-configuration single-module deployment.

---

## 🧪 Automated Testing Scripts

Run tests from the `backend/` directory:

### 1,000+ Email Load Test
```bash
npm run test:load
```

### Sender Rate Limit Test
```bash
npm run test:ratelimit
```

### Restart Persistence Test
```bash
npm run test:restart
```

---

## 📋 Requirement Mapping Matrix

| Assignment Requirement | Implementation | Status |
| :--- | :--- | :---: |
| **Real-Time Live SMTP** | Real-time SMTP support (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) | ✅ Completed |
| **Render Free Tier Fix**| Native Node.js & Static runtimes in `render.yaml` (No Docker paid plan) | ✅ Completed |
| **Merged Single Module**| Integrated Express API & BullMQ worker in single process | ✅ Completed |
| **Real Google OAuth** | `passport-google-oauth20` + JWT auth cookies | ✅ Completed |
| **Scheduled Emails UI** | Screen 2 with recipient, time, subject, status, preview | ✅ Completed |
| **Sent Emails UI** | Screen 3 with sent timestamp, status, and preview links | ✅ Completed |
| **Email Detail View** | Screen 4 with subject, sender avatar, recipient, body, actions | ✅ Completed |
| **Compose View** | Screen 5 with From, To, Subject, Body, Delay, Limit | ✅ Completed |
| **CSV / Text Upload** | Regex parser extracting valid emails & showing detected count badge | ✅ Completed |
| **Send Later Panel** | Screen 6 date/time picker + quick options ("30 min", "Tomorrow 9 AM") | ✅ Completed |
| **Prisma ORM** | Relational schema (User, Campaign, Email, SlackConnection) | ✅ Completed |
| **BullMQ + Redis** | Persistent delayed queue (`emailQueue`) - No cron | ✅ Completed |
| **Worker Concurrency** | Configurable worker concurrency via `WORKER_CONCURRENCY` env | ✅ Completed |
| **Min Email Delay** | Configurable delay enforcement (`MIN_EMAIL_DELAY_MS`) | ✅ Completed |
| **Hourly Rate Limit** | Atomic Redis sliding window per sender (`MAX_EMAILS_PER_HOUR_PER_SENDER`) | ✅ Completed |
| **Rate Limit Reschedule**| Calculates next hour window & reschedules job without dropping | ✅ Completed |
| **Real Slack Alert** | Triggers Slack API `chat.postMessage` on hourly limit reach | ✅ Completed |
| **Ethereal Fallback** | Nodemailer with Ethereal sandbox & web preview URLs | ✅ Completed |
| **Idempotency** | Pre-flight DB check preventing duplicate sends on retry | ✅ Completed |
| **BullMQ Live Board** | Mounted at `/admin/queues` via `@bull-board/express` | ✅ Completed |

