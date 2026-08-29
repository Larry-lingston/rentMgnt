# Rent Manager — Mobile Rent Management System

A full-stack **mobile rent management application** with separate portals for **landlords**, **tenants**, **maintenance crew**, and **room seekers**. Landlords manage properties and approve bookings; seekers browse vacant rooms and request to rent; approved applicants become tenants automatically.

> **Quick start (Windows):** clone this repo and double-click **`start.bat`**. It installs Node.js if missing, installs all dependencies, seeds the database, and launches both servers. Nothing else to set up. See [One-Command Start](#one-command-start-windows).

```bash
git clone https://github.com/Larry-lingston/rentMgnt.git
cd rentMgnt
start.bat
```

---

## Table of Contents

1. [Overview](#overview)
2. [Features by Role](#features-by-role)
3. [Technology Stack](#technology-stack)
4. [System Requirements](#system-requirements)
5. [Project Structure](#project-structure)
6. [Transferring to Another PC](#transferring-to-another-pc)
7. [One-Command Start (Windows)](#one-command-start-windows)
8. [Installation & Setup](#installation--setup)
9. [Running the Application](#running-the-application)
10. [Connecting the Mobile App to the API](#connecting-the-mobile-app-to-the-api)
11. [User Accounts & Registration](#user-accounts--registration)
12. [Demo Credentials](#demo-credentials)
13. [Environment Variables](#environment-variables)
14. [Database](#database)
15. [API Reference](#api-reference)
16. [Mobile App Screens](#mobile-app-screens)
17. [Application UI Guide](APPLICATION_GUIDE.md) — detailed walkthrough of every screen and option
18. [Troubleshooting](#troubleshooting)
19. [Production Notes](#production-notes)

---

## Overview

| Component | Description |
|-----------|-------------|
| **Mobile app** | React Native app built with Expo SDK 53 and Expo Router |
| **Backend API** | Node.js + Express REST API on port `3000` |
| **Database** | SQLite file managed by Prisma ORM (no separate DB server required) |
| **Authentication** | JWT tokens stored on the device via AsyncStorage |
| **Currency** | Ghana Cedis (GHS), shown as **₵** in the app and notifications |

The repository contains **two installable projects**:

- `backend/` — API server and database
- `app/` — Expo mobile client

Both must run at the same time during development.

---

## Features by Role

### Landlord (`admin`)

- Dashboard with income, occupancy, and recent activity
- CRUD properties and rooms (with optional map coordinates)
- View all properties on a map
- Manage tenants (add, edit, assign rooms, delete)
- Record rent payments and view outstanding balances
- Approve or reject **room booking requests** from seekers
- Maintenance requests (open pool FCFS or assign crew)
- Manage maintenance crew members
- Reports (monthly collection, occupancy, tenants)
- Notifications

### Tenant (`tenant`)

- Home dashboard (rent, payments, maintenance summary)
- Pay rent in-app (simulated checkout)
- Payment history and digital receipts
- Submit maintenance requests (FCFS or choose crew)
- View property location on map
- Profile management

### Maintenance crew (`maintenance`)

- **Open Jobs** — claim first-come-first-serve tasks from landlord
- **My Tasks** — update status: pending, completed, cancelled
- View job property locations on map
- Profile management

### Room seeker (`seeker`)

- Browse all vacant rooms (public listing, no login required to browse)
- Request to book a room
- Track booking status (pending / approved / rejected)
- After landlord approval → becomes tenant (log out and log back in)

### Public (no login)

- Browse available rooms at `/browse` from the login screen

---

## Technology Stack

### Mobile (`app/`)

| Technology | Version / Notes |
|------------|-----------------|
| [Expo](https://expo.dev) | SDK ~53 |
| [React Native](https://reactnative.dev) | 0.79.x |
| [React](https://react.dev) | 19.x |
| [Expo Router](https://docs.expo.dev/router/introduction/) | File-based navigation |
| [react-native-maps](https://github.com/react-native-maps/react-native-maps) | Property map pins |
| [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) | JWT persistence |
| [@expo/vector-icons](https://icons.expo.fyi/) | Icons |

### Backend (`backend/`)

| Technology | Version / Notes |
|------------|-----------------|
| [Node.js](https://nodejs.org) | 18+ recommended (20 LTS ideal) |
| [Express](https://expressjs.com) | 5.x |
| [Prisma](https://www.prisma.io) | 6.x ORM |
| [SQLite](https://www.sqlite.org) | Embedded database (`prisma/dev.db`) |
| [bcryptjs](https://www.npmjs.com/package/bcryptjs) | Password hashing |
| [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) | JWT auth |
| [cors](https://www.npmjs.com/package/cors) | Cross-origin API access |

### Architecture

```
┌─────────────────┐     HTTP (JSON)      ┌─────────────────┐
│  Expo Mobile    │ ◄──────────────────► │  Express API    │
│  (app/)         │   JWT Authorization  │  (backend/)     │
└─────────────────┘                      └────────┬────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │  SQLite (Prisma) │
                                       │  dev.db          │
                                       └─────────────────┘
```

---

## System Requirements

### Required on every development machine

| Requirement | Details |
|-------------|---------|
| **Node.js** | v18.0.0 or higher ([download](https://nodejs.org)) — on Windows, `start.bat` installs it for you |
| **npm** | Comes with Node.js |
| **Git** | Optional, for cloning the repo |
| **Internet** | Needed for `npm install` (first time only) |

### For mobile testing (pick one or more)

| Option | Requirements |
|--------|----------------|
| **Physical phone** | [Expo Go](https://expo.dev/go) app (iOS or Android); phone and PC on the **same Wi‑Fi** |
| **Android emulator** | [Android Studio](https://developer.android.com/studio) with an AVD |
| **iOS simulator** | macOS with Xcode (iOS development only) |
| **Web browser** | `npm run web` in `app/` (limited; maps use fallback UI) |

### Disk space

- Approximately **500 MB–1 GB** after installing both `node_modules` folders.

### Firewall

- Allow inbound connections on ports **3000** and **8081** if testing from a physical device on your LAN.
- Windows: run `start.bat` **as administrator once** and it adds the rule for you. Otherwise allow Node.js on private networks when prompted.

---

## Project Structure

```
mobile/
├── README.md                 # This file
├── functionality.docx        # Original requirements document
│
├── backend/                  # API server
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma     # Database models
│   │   ├── seed.js           # Demo data (admin, tenant, crew, properties)
│   │   └── dev.db            # SQLite database (created after db push)
│   └── src/
│       ├── index.js          # Server entry point
│       ├── middleware/
│       │   └── auth.js       # JWT middleware & role checks
│       ├── lib/
│       │   └── helpers.js    # Notifications, receipt IDs, etc.
│       └── routes/
│           ├── auth.js
│           ├── properties.js
│           ├── tenants.js
│           ├── payments.js
│           ├── maintenance.js
│           ├── dashboard.js
│           ├── notifications.js
│           ├── reports.js
│           ├── map.js
│           ├── listings.js   # Public vacant room listings
│           ├── bookings.js   # Room booking & landlord approval
│           ├── tenant-portal.js
│           ├── staff-portal.js
│           └── staff.js
│
└── app/                      # Expo mobile client
    ├── package.json
    ├── app.json              # Expo config
    ├── app/                  # Screens (Expo Router)
    │   ├── index.js          # Splash
    │   ├── login.js
    │   ├── register.js
    │   ├── browse.js         # Public room listings
    │   ├── room-detail.js
    │   ├── map.js
    │   ├── (tabs)/           # Landlord portal
    │   ├── (tenant-tabs)/    # Tenant portal
    │   ├── (staff-tabs)/     # Maintenance portal
    │   └── (seeker-tabs)/    # Room seeker portal
    ├── components/           # UI components (PropertyMapView, etc.)
    ├── context/
    │   └── AuthContext.js    # Login state & JWT
    ├── services/
    │   └── api.js            # HTTP client for backend
    ├── constants/
    │   └── theme.js          # Colors & API_BASE_URL
    └── utils/
        ├── roles.js          # Role routing & account types
        └── params.js
```

---

## Transferring to Another PC

The easiest route is to clone from GitHub and run the launcher:

```bash
git clone https://github.com/Larry-lingston/rentMgnt.git
cd rentMgnt
start.bat
```

The repo deliberately excludes `node_modules/`, `backend/prisma/dev.db`, and `backend/uploads/`. `start.bat` recreates all three, so the clone comes up with a freshly seeded demo database.

If you are copying the folder by USB or zip instead, read on.

### What to copy

Copy the **entire `mobile` folder**, including source code. You may **exclude** these to save space (they are recreated with `npm install`):

- `backend/node_modules/`
- `app/node_modules/`
- `backend/prisma/dev.db` (optional — omit if you want a fresh database on the new PC)

### What you must do on the new PC

1. On Windows, double-click **`start.bat`** — it installs Node.js if needed, then handles dependencies, the database, the IP address, the firewall rule, and both servers. See [One-Command Start](#one-command-start-windows).
2. Install **Expo Go** on the phone and keep phone and PC on the **same Wi‑Fi**

To do it manually instead:

1. Open **two terminals** (backend + mobile)
2. Run the full setup below — do **not** skip `npm install`, `prisma generate`, or `db push`
3. Update **`app/constants/theme.js`** if using a physical device or Android emulator (see [Connecting the Mobile App](#connecting-the-mobile-app-to-the-api))

### If you copied `dev.db`

The database file includes all existing users and data. Run `npm run db:seed` only if you need demo accounts and they are missing.

### If you did not copy `dev.db`

Run the full database setup:

```bash
cd backend
npx prisma db push
npm run db:seed
```

---

## One-Command Start (Windows)

A fresh Windows PC needs **nothing pre-installed**. Get the project onto the machine (clone it with [Git](https://git-scm.com/downloads), or just copy the folder from a USB drive), then double-click **`start.bat`**:

```bash
git clone https://github.com/Larry-lingston/rentMgnt.git
cd rentMgnt
start.bat
```

That is the whole setup. `start.bat` (or `.\start.ps1` from PowerShell) does everything in one go:

1. **Installs Node.js LTS via `winget`** if it is missing or older than v18 — approve the Windows prompt when it appears
2. Adds a Windows Firewall rule for ports 3000 and 8081 so your phone can reach the API (only when run as administrator)
3. Runs `npm install` in `backend/` and `app/` if `node_modules` is missing
4. Runs `prisma generate`, `prisma db push`, and seeds demo data the first time
5. Detects this machine's Wi-Fi IP and writes it into `app/constants/theme.js` (`DEV_HOST`)
6. Opens the backend API and the Expo dev server in two separate windows
7. Prints the URLs and demo logins once the API responds to a health check

Repeat runs skip the slow steps, so day-to-day it just starts both servers.

### What you still need to do by hand

| Requirement | Why the script can't do it |
|-------------|---------------------------|
| **Git** (optional) | Only needed to `git clone`; copying the folder works instead |
| **Expo Go on your phone** | Installed from the Play Store / App Store on the phone itself |
| **Same Wi-Fi network** | The phone and the PC must be on the same network |

If Node.js has to be installed, **close the window and run `start.bat` again afterwards** if the script reports that `npm` is still not on `PATH` — a new window picks up the updated `PATH`.

### Options

| Command | What it does |
|---------|--------------|
| `start.bat` | Normal start |
| `start.bat -Reseed` | Delete the database and re-seed demo data (wipes your data) |
| `start.bat -Reinstall` | Delete `node_modules` and reinstall from scratch |
| `start.bat -ApiHost 192.168.1.50` | Use a specific IP instead of auto-detection |
| `start.bat -SkipIpUpdate` | Leave `theme.js` alone |
| `start.bat -SetupOnly` | Install and prepare everything, but don't start the servers |
| `start.bat -NoAutoInstall` | Never try to install Node.js automatically |
| `stop.bat` | Stop whatever is listening on ports 3000 and 8081 |

First run on a clean clone takes roughly 10 minutes (mostly `npm install` for Expo). Later runs start in seconds.

If PowerShell blocks the script, use `start.bat` — it already runs with `-ExecutionPolicy Bypass`.

On macOS or Linux, follow the manual steps below instead.

---

## Installation & Setup

> Only needed if you are not using `start.bat` above.

### Step 1 — Verify Node.js

```bash
node -v    # Should print v18.x or higher
npm -v
```

### Step 2 — Backend setup

Open a terminal in the project root:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
```

| Command | Purpose |
|---------|---------|
| `npm install` | Install Express, Prisma, bcrypt, JWT, etc. |
| `npx prisma generate` | Generate Prisma Client from schema |
| `npx prisma db push` | Create/update SQLite tables |
| `npm run db:seed` | Insert demo landlord, tenant, crew, properties |

### Step 3 — Mobile app setup

Open a **second** terminal:

```bash
cd app
npm install
```

> **Important:** Use `npm start` to run Expo. Avoid `npx expo start` unless you know you need it — on some networks it tries to download Expo globally and can fail with `ECONNRESET`.

---

## Running the Application

You need **both** servers running.

### Terminal 1 — Backend API

```bash
cd backend
npm run dev
```

Expected output:

```
Rent Management API running on http://0.0.0.0:3000
```

Verify in a browser or with curl:

```bash
curl http://localhost:3000/api/health
# {"status":"ok"}
```

### Terminal 2 — Mobile app

```bash
cd app
npm start
```

Then:

| Action | How |
|--------|-----|
| **Phone (Expo Go)** | Scan the QR code in the terminal or Expo Dev Tools |
| **Android emulator** | Press `a` in the Expo terminal |
| **iOS simulator** | Press `i` (macOS + Xcode only) |
| **Web** | Press `w` or run `npm run web` |

### First launch flow

1. Splash screen → Login (or Register)
2. Log in with demo credentials, or register a new account
3. App routes you to the correct portal based on role

---

## Connecting the Mobile App to the API

The API URL is built in `app/constants/theme.js`:

```javascript
export const API_BASE_URL = `http://${getDevServerHost()}:3000/api`;
```

### Scenario guide

| How you run the app | What to set |
|---------------------|-------------|
| **iOS Simulator** | Usually works with defaults (`localhost`) |
| **Android Emulator** | Set `DEV_HOST = '10.0.2.2'` in `theme.js` (already default) |
| **Physical phone (Expo Go)** | Set `DEV_HOST` to your PC's LAN IP, e.g. `'192.168.1.105'` |

### Find your PC's LAN IP

**Windows (PowerShell):**

```powershell
ipconfig
# Look for "IPv4 Address" under your Wi-Fi adapter
```

**macOS / Linux:**

```bash
ipconfig getifaddr en0   # macOS Wi-Fi
# or
hostname -I              # Linux
```

Edit `app/constants/theme.js`:

```javascript
const DEV_HOST = '192.168.1.105';  // Replace with YOUR computer's IP
```

Restart Expo after changing this file (`npm start -- --clear`).

### Checklist if the app cannot reach the API

- [ ] Backend is running (`npm run dev` in `backend/`)
- [ ] `http://localhost:3000/api/health` works in a browser on the PC
- [ ] Phone and PC are on the **same Wi‑Fi** (not mobile data)
- [ ] `DEV_HOST` matches the PC IP (physical device)
- [ ] Windows Firewall allows Node.js on private networks
- [ ] Restart Expo with cache clear: `npm start -- --clear`

---

## User Accounts & Registration

Anyone can **register** and choose an account type on the Create Account screen:

| Account type | System role | Lands in | Notes |
|--------------|-------------|----------|-------|
| **Landlord** | `admin` | Landlord dashboard | Manages properties & tenants |
| **Looking for a room** | `seeker` | Seeker portal | Browse & book vacant rooms |
| **Tenant** | `tenant` | Tenant dashboard | Requires **landlord username** (e.g. `admin`) |
| **Maintenance crew** | `maintenance` | Crew portal | Requires **landlord username** |

**Login** works for all roles — each user is redirected to their portal automatically.

### Booking → tenant flow

1. Seeker browses rooms and taps **Request to Book**
2. Landlord opens **More → Booking Requests** and taps **Approve**
3. System creates tenant profile, assigns room, marks room occupied
4. Seeker **logs out and logs back in** to access the tenant portal

---

## Demo Credentials

After running `npm run db:seed` in `backend/`, the following **development-only** accounts are available. They are not shown on the login screen — use this table when testing locally or after setting up on a new machine.

| Role | Username | Password | Portal |
|------|----------|----------|--------|
| Landlord | `admin` | `admin123` | Landlord dashboard `(tabs)` |
| Tenant | `john` | `tenant123` | Tenant portal `(tenant-tabs)` |
| Maintenance crew | `maint` | `maint123` | Crew portal `(staff-tabs)` |

**What the seed includes**

- Sample properties in **Accra, Ghana**: **East Legon Apartments**, **Osu Residential Houses** (rent amounts in **₵**)
- Vacant rooms with photos for browse/booking tests
- A tenant assigned to a unit (john) and maintenance crew linked to the landlord

**Room seeker testing:** Register a new account and choose **Looking for a room**, or use browse without logging in.

**Reset demo data:** Delete `backend/prisma/dev.db`, then run `npx prisma db push` and `npm run db:seed` again.

---

## Environment Variables

The backend works out of the box with defaults. Optional overrides:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | API server port |
| `JWT_SECRET` | `rent-management-secret-key` | JWT signing secret (change in production) |

**Windows (PowerShell) — example:**

```powershell
$env:PORT = "3000"
$env:JWT_SECRET = "your-secret-here"
npm run dev
```

**macOS / Linux:**

```bash
PORT=3000 JWT_SECRET=your-secret-here npm run dev
```

---

## Database

| Item | Location |
|------|----------|
| Schema | `backend/prisma/schema.prisma` |
| SQLite file | `backend/prisma/dev.db` |
| Seed script | `backend/prisma/seed.js` |

### Main models

- **User** — accounts with roles: `admin`, `tenant`, `maintenance`, `seeker`
- **Property** — buildings with address and optional lat/lng
- **Room** — units within a property (`vacant` / `occupied`)
- **Tenant** — tenant profile linked to landlord and optional room
- **Payment** — rent payments with receipts
- **MaintenanceRequest** — repairs with FCFS or assigned crew
- **RoomBooking** — seeker booking requests (`pending` / `approved` / `rejected`)
- **Notification** — in-app alerts

### Useful database commands

```bash
cd backend

# Apply schema changes after pulling updates
npx prisma db push

# Regenerate client after schema changes
npx prisma generate

# Re-run demo seed (safe to run again; skips if admin exists)
npm run db:seed

# Open visual DB browser (optional)
npx prisma studio
```

### Reset database completely

```bash
cd backend
del prisma\dev.db          # Windows
# rm prisma/dev.db         # macOS/Linux
npx prisma db push
npm run db:seed
```

---

## API Reference

Base URL: `http://<host>:3000/api`

Auth: send `Authorization: Bearer <token>` for protected routes.

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Server health check |

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register (body: `accountType`, `landlordUsername` for tenant/crew) |
| POST | `/auth/login` | No | Login |
| POST | `/auth/forgot-password` | No | Password reset placeholder |
| GET | `/auth/profile` | Yes | Current user profile |
| PUT | `/auth/profile` | Yes | Update profile |

### Public listings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/listings` | No | All vacant rooms |
| GET | `/listings/:roomId` | No | Room detail |

### Landlord (admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Dashboard stats |
| CRUD | `/properties` | Property management |
| CRUD | `/tenants` | Tenant management |
| GET/POST | `/payments` | Payments & outstanding |
| GET/POST | `/maintenance` | Maintenance requests |
| PUT | `/maintenance/:id/assign` | Assign crew |
| PUT | `/maintenance/:id/status` | Update status |
| GET | `/bookings` | Booking requests |
| PUT | `/bookings/:id/approve` | Approve → create tenant |
| PUT | `/bookings/:id/reject` | Reject booking |
| GET/POST | `/staff` | Maintenance crew CRUD |
| GET | `/reports/*` | Reports |
| GET | `/notifications` | Notifications |
| GET | `/map/locations` | Property map data |

### Tenant portal

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tenant-portal/dashboard` | Tenant home data |
| GET | `/tenant-portal/payments` | Payment history |
| POST | `/tenant-portal/payments/pay` | Simulated pay rent |
| GET | `/tenant-portal/payments/:id/receipt` | Receipt |
| GET/POST | `/tenant-portal/maintenance` | Maintenance requests |
| GET | `/tenant-portal/crew` | Search maintenance crew |

### Maintenance portal

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/staff-portal/available` | Open FCFS jobs |
| POST | `/staff-portal/available/:id/claim` | Claim job |
| GET | `/staff-portal/tasks` | Assigned tasks |
| PUT | `/staff-portal/tasks/:id/status` | Update task status |

### Seeker

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings` | Request to book a room |
| GET | `/bookings/mine` | My booking requests |

---

## Mobile App Screens

| Area | Screens |
|------|---------|
| **Auth** | Splash, Login, Register |
| **Public** | Browse rooms, Room detail, Map |
| **Landlord** | Dashboard, Properties, Tenants, Payments, More (Maintenance, Crew, Bookings, Reports, Notifications, Profile) |
| **Tenant** | Home, Payments, Maintenance, Profile |
| **Maintenance** | My Tasks, Open Jobs, Profile |
| **Seeker** | Browse, My Requests, Profile |

For a **screen-by-screen guide** to every button, tab, and form field, see **[APPLICATION_GUIDE.md](APPLICATION_GUIDE.md)**.

---

## Troubleshooting

### `npm install` fails or is very slow

- Use a stable internet connection; disable VPN if needed
- Try: `npm cache clean --force` then `npm install` again
- Ensure Node.js 18+ is installed

### `EPERM` or `operation not permitted` during `prisma generate`

- Stop the backend server (`Ctrl+C` in the backend terminal)
- Close any process using `dev.db`
- Run `npx prisma generate` again

### `expo is not recognized` or `ECONNRESET` when starting Expo

1. Close all Expo/Node terminals
2. Clean reinstall the mobile app:

   ```bash
   cd app
   rmdir /s /q node_modules    # Windows
   del package-lock.json
   npm install
   npm start
   ```

3. Always prefer `npm start` over `npx expo start`

### App shows network / login errors on phone

- Confirm backend is running
- Set correct `DEV_HOST` in `app/constants/theme.js`
- Phone must be on same Wi‑Fi as the PC
- Test API from phone browser: `http://<PC-IP>:3000/api/health`

### `Request failed` or `401` after approval

- User role changed in DB but JWT is stale — **log out and log back in**

### Maps not showing on device

- Maps require a native build or Expo Go on a real device/emulator
- On web, the app shows address cards with a link to Google Maps instead

### `&&` does not work in PowerShell

Use `;` to chain commands on older PowerShell:

```powershell
cd backend; npm install; npx prisma db push
```

---

## Production Notes

This project is configured for **local development**. Before deploying to production:

1. Replace SQLite with PostgreSQL or MySQL and update `schema.prisma` datasource
2. Set a strong `JWT_SECRET` environment variable
3. Use HTTPS for the API
4. Configure `react-native-maps` Google Maps API keys in `app.json` for Android
5. Replace simulated rent payments with a real gateway (Stripe, M-Pesa, etc.)
6. Do not commit `dev.db` or secrets to version control

---

## Quick Start Cheat Sheet

```bash
# Terminal 1 — Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev

# Terminal 2 — Mobile
cd app
npm install
npm start
```

**Demo login (see [Demo Credentials](#demo-credentials)):** `admin` / `admin123`  
**API health:** http://localhost:3000/api/health  
**Configure device API:** `app/constants/theme.js` → `DEV_HOST`

---

## License

Private / educational project. See `functionality.docx` for original requirements.
