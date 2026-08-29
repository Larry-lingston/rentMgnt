# Rent Manager — Application UI Guide

A walkthrough of every screen, menu, button, and option in the Rent Manager mobile app. Use this as a quick reference when exploring the app or onboarding new users.

**Currency:** All amounts are in **Ghana Cedis (GHS)** and display as **₵** (e.g. ₵1,200.00).

---

## Table of Contents

1. [How the app is organized](#how-the-app-is-organized)
2. [Getting started (no login)](#getting-started-no-login)
3. [Login & registration](#login--registration)
4. [Landlord portal](#landlord-portal)
5. [Tenant portal](#tenant-portal)
6. [Maintenance crew portal](#maintenance-crew-portal)
7. [Room seeker portal](#room-seeker-portal)
8. [Shared screens & forms](#shared-screens--forms)
9. [Common UI patterns](#common-ui-patterns)
10. [Typical user journeys](#typical-user-journeys)

---

## How the app is organized

Rent Manager has **four logged-in portals**, each with its own bottom tab bar. After you sign in, the app sends you to the portal that matches your account role.

| Role | Who it's for | Bottom tabs |
|------|----------------|-------------|
| **Landlord** (`admin`) | Property owners managing rentals | Dashboard · Properties · Tenants · Payments · More |
| **Tenant** (`tenant`) | People currently renting a unit | Home · Payments · Maintenance · Alerts · Profile |
| **Maintenance crew** (`maintenance`) | Repair staff working for a landlord | Open Jobs · My Tasks · Profile |
| **Room seeker** (`seeker`) | People browsing and applying for rooms | Browse · My Requests · Profile |

Anyone can **browse vacant rooms without logging in** from the login screen.

```
                    ┌─────────────┐
                    │   Splash    │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        ┌──────────┐              ┌──────────┐
        │  Login   │              │  Browse  │  (public)
        └────┬─────┘              └────┬─────┘
             │                         │
    ┌────────┼────────┬────────┬──────┴──────┐
    ▼        ▼        ▼        ▼             ▼
 Landlord  Tenant   Crew    Seeker      Room detail
 portal    portal  portal   portal      → Book request
```

---

## Getting started (no login)

### Splash screen

- Shows the **Rent Manager** logo and a loading spinner for about 2 seconds.
- If you were logged in before, you are sent straight to your portal.
- If not, you are sent to **Login**.

### Browse available rooms (public)

**How to open:** Login screen → **Browse available rooms**, or sign in as a seeker (Browse tab).

| UI element | What it does |
|------------|----------------|
| **Room cards** | Photo, property name, monthly rent (₵), room number, address, landlord name |
| **Available badge** | Green label on each listing — room is vacant |
| **Tap a card** | Opens **Room Details** |
| **Pull down** | Refreshes the listing |

---

## Login & registration

### Login

| Field / button | Purpose |
|----------------|---------|
| **Username** | Your account username |
| **Password** | Your account password |
| **Sign In** | Authenticates and opens your role's portal |
| **Browse available rooms** | Opens public room listings (no account needed) |
| **Forgot password?** | Enter email → **Send reset link** (demo reset flow) |
| **Register** | Opens account creation |

After login, if you came from a room page, seekers are returned to that room to finish booking.

### Register — Create account

Choose one of four account types (tap the card to select):

| Account type | Becomes role | Extra field | What you can do |
|--------------|--------------|-------------|-----------------|
| **Landlord** | `admin` | — | Full property management portal |
| **Looking for a room** | `seeker` | — | Browse and request rooms |
| **Tenant** | `tenant` | **Landlord username** | Join an existing landlord's portfolio |
| **Maintenance crew** | `maintenance` | **Landlord username** | Work on that landlord's jobs |

**Required fields:** Username, email, name, password (phone is optional).

**Create account** saves your profile and signs you in. **Already have an account? Login** returns to the login screen.

---

## Landlord portal

Bottom tabs: **Dashboard · Properties · Tenants · Payments · More**

Extra screens live under **More** (not on the tab bar).

---

### Dashboard tab

Overview of your rental business at a glance.

| Stat card | Meaning |
|-----------|---------|
| **Properties** | Total properties you manage |
| **Tenants** | Total tenant records |
| **Occupied** | Rooms currently rented |
| **Vacant** | Empty rooms available |
| **Monthly Income** | Rent collected this month (₵) |
| **Outstanding** | Unpaid rent still owed (₵) |

**Recent Transactions** — list of the latest payments: tenant name, property/room, date, amount.

**Pull down** on the screen to refresh all numbers.

---

### Properties tab

Manage buildings and see them on a map.

| Button / action | What it does |
|-----------------|--------------|
| **View All on Map** | Opens the map with pins for every property that has coordinates |
| **Add Property** | Opens the property form (create new) |
| **Property card** | Thumbnail image, name, address, room counts, property type badge |
| **Location icon** | Map focused on that property |
| **Edit icon** | Edit property details and images |
| **Trash icon** | Delete property (confirmation required) |
| **Pull down** | Refresh list |

---

### Tenants tab

| Button / action | What it does |
|-----------------|--------------|
| **Add Tenant** | Opens tenant form |
| **Tap tenant row** | Opens **Tenant Details** (full profile + payment history) |
| **Edit icon** | Edit tenant info and room assignment |
| **Trash icon** | Remove tenant (confirmation required) |

Each row shows: name, phone, assigned property/room (or "Unassigned").

---

### Payments tab

| Button / action | What it does |
|-----------------|--------------|
| **Record Payment** | Opens payment form to log rent received |
| **History tab** | All recorded payments: tenant, receipt #, date, amount, method |
| **Outstanding tab** | Tenants who still owe rent this month — shows rent, paid, and due amounts |
| **Pull down** | Refresh both tabs |

---

### More tab

User summary card at the top (name, email). Menu items:

| Menu item | Opens | Purpose |
|-----------|--------|---------|
| **Booking Requests** | Booking Requests screen | Review seekers who want to rent a room |
| **Maintenance** | Maintenance screen | View and manage repair requests |
| **Maintenance Crew** | Crew management | Add and list maintenance staff |
| **Reports** | Reports screen | Generate collection, occupancy, and tenant reports |
| **Notifications** | Notifications | Rent reminders and system alerts |
| **Profile** | Profile | Edit account and log out |
| **Logout** | — | Signs out (confirmation required) |

---

### Booking Requests (from More)

| UI element | What it does |
|------------|----------------|
| **Pending banner** | Yellow alert when requests need review |
| **Request card** | Applicant name, room, rent, contact info, optional message |
| **Status badge** | `pending`, `approved`, or `rejected` |
| **Approve** | Creates a tenant account, assigns the room, marks booking approved |
| **Reject** | Declines the application |

> After approval, the applicant must **log out and log back in** to use the tenant portal.

---

### Maintenance (from More)

| Button / action | What it does |
|-----------------|--------------|
| **Submit Request** | Opens maintenance form (landlord-created request) |
| **Tap a request card** | Action menu: **Assign Staff** or **Update Status** |
| **Assign Staff** | Pick a crew member from your team |
| **Update Status** | Cycles: pending → cancelled → completed |

Cards show title, description, property, tenant (if any), FCFS vs selected assignment, assigned crew, and date.

---

### Maintenance Crew (from More)

| Button / action | What it does |
|-----------------|--------------|
| **Add Crew Member** | Modal form: name, username, email, phone, password |
| **Crew list** | Shows each member's name, username, email, phone |

Crew members log in with the username/password you create here (or they self-register with your landlord username).

---

### Reports (from More)

Tap a report type to generate it on screen:

| Report | Shows |
|--------|--------|
| **Monthly Collection** | Total collected this month, payment count, per-tenant breakdown |
| **Outstanding Balances** | Total owed and each tenant's balance |
| **Property Occupancy** | Occupied vs total rooms and occupancy % per property |
| **Tenant Report** | All tenants with property, room, and payment count |

The active report button is highlighted with a border.

---

### Notifications (from More)

| Button / action | What it does |
|-----------------|--------------|
| **Refresh reminders** | Syncs rent-upcoming and rent-due alerts from the server |
| **Notification card** | Title, message, timestamp |
| **Unread cards** | Blue left border + dot; tap to mark as read |
| **Pull down** | Refresh list |

Typical alerts: rent due soon, rent overdue, payment recorded.

---

### Profile (from More)

| Field / button | Purpose |
|----------------|---------|
| **Name, Email, Phone** | Editable profile fields |
| **New Password** | Optional — leave blank to keep current password |
| **Save Changes** | Updates your account |
| **Logout** | Signs out |

---

## Tenant portal

Bottom tabs: **Home · Payments · Maintenance · Alerts · Profile**

---

### Home tab

| UI element | What it does |
|------------|----------------|
| **Welcome card** | Your name and current unit (property + room number) |
| **Rent alert banner** | Appears when you have unread alerts — tap to open **Alerts** tab |
| **View Property on Map** | Map pin for your building (if coordinates exist) |
| **Monthly Rent** | Your unit's rent amount (₵) |
| **Paid** | What you've paid this month |
| **Outstanding** | What you still owe |
| **Recent Payments** | Last payments with receipt numbers |
| **Maintenance** | Summary of your recent repair requests |

**Pull down** to refresh.

---

### Payments tab

| UI element | What it does |
|------------|----------------|
| **Summary bar** | Monthly rent vs outstanding balance |
| **Pay Rent In App** | Shown when you owe money — opens payment modal |
| **Payment history rows** | Receipt #, date, method, amount |
| **Tap a payment** | View full receipt in a popup (receipt #, transaction ref, amount, method, date) |

**Pay Rent modal:**

| Option | What it does |
|--------|----------------|
| **Amount (₵)** | Defaults to outstanding balance; editable |
| **Demo card preview** | Simulated card — no real charge in development |
| **Pay Now** | Records payment and generates a receipt |
| **Cancel** | Closes without paying |

---

### Maintenance tab

| Button / action | What it does |
|-----------------|--------------|
| **Submit Request** | Opens request modal |
| **Request cards** | Title, status, description, assignment mode, assigned crew |

**Submit Request modal:**

| Field / option | Purpose |
|--------------|---------|
| **Title** | Short summary of the issue (required) |
| **Description** | Details (required) |
| **First Available (FCFS)** | Any crew member can claim the job |
| **Choose Crew** | Search and pick a specific crew member |
| **Submit** | Sends request to your landlord's system |

---

### Alerts tab

Same notification list as the landlord view, but **without** the "Refresh reminders" button. Rent due/upcoming alerts appear here. Tap unread items to mark them read.

---

### Profile tab

Same as landlord profile: edit name, email, phone, password; save or log out.

---

## Maintenance crew portal

Bottom tabs: **Open Jobs · My Tasks · Profile**

You must register with your **landlord's username** so jobs appear in your pool.

---

### Open Jobs tab

First-come-first-serve job board from your landlord.

| UI element | What it does |
|------------|----------------|
| **Hint text** | Explains FCFS claiming |
| **Job card** | Title, description, property, tenant (if any) |
| **Map** | View property location |
| **Claim job →** | Assigns the job to you (fails if someone else claimed first) |

---

### My Tasks tab

Jobs assigned to you (claimed or directly selected by tenant/landlord).

| UI element | What it does |
|------------|----------------|
| **Tap a task** | Choose new status: **Pending**, **Completed**, or **Cancelled** |
| **Location icon** | Open property on map |
| **Status badge** | Current job state |

---

### Profile tab

Edit your account details or log out.

---

## Room seeker portal

Bottom tabs: **Browse · My Requests · Profile**

---

### Browse tab

Same room listings as the public browse screen. Tap a room to see details and request to book.

---

### My Requests tab

Tracks every booking you have submitted.

| UI element | What it does |
|------------|----------------|
| **Request card** | Property name, room, rent, submission date, status badge |
| **Approved message** | Reminds you to log out and back in to access the tenant portal |
| **Pull down** | Refresh status |

Statuses: **pending** (waiting on landlord), **approved**, **rejected**.

---

### Profile tab

Edit account or log out.

---

## Shared screens & forms

These screens open on top of any portal (modal or stack navigation). Use the **back** arrow in the header to return.

---

### Room Details

Opened from Browse or after login with a `roomId` link.

| Section / button | What it shows / does |
|------------------|----------------------|
| **Photo gallery** | Swipeable property/room images |
| **Rent hero** | Monthly rent in ₵ |
| **Chips** | Room number, property type |
| **Details card** | Address, landlord name, description |
| **Message to landlord** | Optional note (seekers only) |
| **Request to Book** | Submits booking (seekers only; prompts login/register if needed) |
| **View on Map** | Property location (if coordinates set) |

**Booking rules:**

- Must be signed in as a **seeker** (renter account).
- Landlords, existing tenants, and maintenance accounts cannot book.
- After submitting, you are taken to **My Requests**.

---

### Property Map

| Mode | Behavior |
|------|----------|
| **All properties** | From Properties → View All on Map |
| **Single property** | From a location icon or Room Details → View on Map |

Shows map pins for properties with latitude/longitude. On web, address cards with external map links may appear instead of native maps.

---

### Property form (Add / Edit Property)

| Field | Required | Notes |
|-------|----------|-------|
| **Name** | Yes | Property display name |
| **Address** | Yes | Full street address |
| **Description** | No | Shown to seekers on room detail |
| **Total Rooms** | Yes (new only) | Number of units to create |
| **Property photos** | Yes | Take a photo or choose from gallery; at least one image required |
| **Latitude / Longitude** | No | Enables map pins |
| **Save** | — | Creates or updates the property |

Images are required so seekers can see photos before booking.

---

### Tenant form (Add / Edit Tenant)

| Field | Required | Notes |
|-------|----------|-------|
| **Name** | Yes | |
| **Email** | No | |
| **Phone** | Yes | |
| **Assign Room** | No | Horizontal chips — only **vacant** rooms listed, plus current room when editing |
| **Save** | — | Creates or updates tenant |

---

### Tenant Details

Read-only view opened from the Tenants list.

| Section | Content |
|---------|---------|
| **Header** | Name, phone, email |
| **Assignment** | Property, room, monthly rent |
| **Lease** | Start and end dates (if set) |
| **Payment History** | All receipts with dates and amounts |

Use the edit icon on the Tenants list to make changes.

---

### Record Payment form

Opened from Payments → **Record Payment**.

| Field | Purpose |
|-------|---------|
| **Select Tenant** | Tap a tenant card to choose |
| **Amount (₵)** | Payment amount |
| **Payment Method** | cash · bank transfer · check · mobile money |
| **Notes** | Optional memo |
| **Record Payment** | Saves payment and shows receipt number |

---

### Maintenance Request form (landlord)

Opened from Maintenance → **Submit Request**.

| Field | Purpose |
|-------|---------|
| **Title / Description** | Required |
| **Property** | Required — tap to select |
| **Tenant** | Optional — link to a tenant |
| **Crew assignment** | FCFS (open pool) or choose a specific crew member |
| **Submit** | Creates the request |

---

## Common UI patterns

### Pull to refresh

Most list screens support **pull down** to reload data from the server.

### Status badges

Colored pills on cards indicate state, for example:

- Bookings: pending, approved, rejected
- Maintenance: pending, completed, cancelled
- Rooms: vacant, occupied

### Money display

All currency uses `₵` with two decimal places in summaries (e.g. ₵1,200.00). Browse cards may show whole amounts (e.g. ₵1,200/mo).

### Empty states

When a list has no items, a friendly message and icon appear (e.g. "No properties yet — Add your first property!").

### Confirmations

Destructive actions (delete property/tenant, logout, reject booking) show a confirmation dialog before proceeding.

### Session & role changes

If your role changes in the database (e.g. seeker → tenant after booking approval), **log out and log back in** so your JWT matches your new permissions.

---

## Typical user journeys

### New renter finds a room

1. Login screen → **Browse available rooms**
2. Tap a room → **Room Details**
3. **Register** as "Looking for a room"
4. **Request to Book** (optional message)
5. **My Requests** → wait for **pending** → **approved**
6. Log out → log back in → **Tenant** portal (Home, Payments, etc.)

### Landlord onboards a property

1. **Properties** → **Add Property** (name, address, images, optional map coords)
2. **Tenants** → **Add Tenant** → assign a vacant room  
   *— or —* approve a **Booking Request** from a seeker
3. **Payments** → **Record Payment** when rent is received
4. **Dashboard** and **Reports** to track income and occupancy

### Tenant pays rent

1. **Home** — check **Outstanding**
2. **Payments** → **Pay Rent In App**
3. Enter amount → **Pay Now**
4. Tap payment row → **View Receipt**

### Maintenance workflow

1. **Tenant** submits request (FCFS or chosen crew)
2. **Landlord** sees it under More → Maintenance (can assign staff or update status)
3. **Crew** claims from **Open Jobs** or finds it in **My Tasks**
4. Crew taps task → sets **Completed** or **Cancelled**

---

## Quick reference — where to find things

| I want to… | Go to… |
|------------|--------|
| See vacant rooms | Login → Browse, or Seeker → Browse |
| Approve a renter | Landlord → More → Booking Requests |
| Add a building | Landlord → Properties → Add Property |
| Log a cash payment | Landlord → Payments → Record Payment |
| Pay my rent | Tenant → Payments → Pay Rent In App |
| Report a leak | Tenant → Maintenance → Submit Request |
| Claim a repair job | Crew → Open Jobs → Claim job |
| See who owes rent | Landlord → Payments → Outstanding tab |
| Rent reminders | Landlord → More → Notifications; Tenant → Alerts |
| Change my password | Any portal → Profile (or More → Profile for landlord) |

---

*For installation, API details, and demo accounts, see [README.md](README.md).*
