# SplitEvent — Shared Expense Splitter for Group Events (v2 UI)

**This is the alternate UI/UX version**: a dark, card-based app with a left
sidebar and colored avatar initials, instead of the light ledger/receipt
look from the first version. The backend (API, database logic, split/
settlement calculations) is identical to v1 — only the frontend look and
layout changed.

A MERN stack app (MongoDB, Express, React, Node) implementing all the modules from the project plan:

1. **User Module** — Register, Login, Logout, Manage Profile
2. **Event Module** — Create / View / Edit / Delete Event
3. **Participant Module** — Add / Remove / View Participants
4. **Expense Module** — Add / Edit / Delete / View Expense
5. **Expense Split Module** — Select payer, select members, calculate equal share, show amount owed
6. **Summary Module** — Total expense, amount paid, amount owed, settlement report
7. **Dashboard** — Total events, total participants, total expenses, recent activities

## Project structure

```
expense-splitter/
  server/   Express + MongoDB API
  client/   React (Vite) frontend
```

## 1. Backend setup

```bash
cd server
npm install
cp .env.example .env
# edit .env if your MongoDB URI or JWT secret differ
npm run dev      # starts on http://localhost:5000
```

You need a MongoDB instance running (local `mongod`, or a free Atlas cluster —
just paste its connection string into `MONGO_URI` in `.env`).

### API overview

| Module | Endpoint |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET/PUT /api/auth/profile` |
| Events | `GET/POST /api/events`, `GET/PUT/DELETE /api/events/:id` |
| Participants | `GET/POST /api/events/:eventId/participants`, `DELETE /api/events/:eventId/participants/:id` |
| Expenses | `GET/POST /api/events/:eventId/expenses`, `GET/PUT/DELETE /api/events/:eventId/expenses/:id` |
| Summary | `GET /api/events/:eventId/summary` |
| Dashboard | `GET /api/dashboard` |

All routes except register/login require a `Authorization: Bearer <token>` header.

## 2. Frontend setup

```bash
cd client
npm install
cp .env.example .env   # points at http://localhost:5000/api by default
npm run dev             # starts on http://localhost:5173
```

Open http://localhost:5173, register an account, create an event, add
participants, log expenses, and check the Summary tab for who owes whom.

## How the split works

- Every expense has a **payer** (one participant) and a **split-among** list
  (any number of participants).
- The amount is divided **equally** among everyone in the split-among list.
- The Summary tab totals, per participant, how much they **paid** vs how much
  they **owe**, and shows their **net balance**.
- The **settlement report** uses a greedy debtor→creditor matching algorithm
  to produce the minimum number of payments needed to settle everyone up.

## Notes / next steps

- Passwords are hashed with bcrypt; auth uses JWT (7-day expiry).
- Participants can be registered users or simple guest names/emails — you
  don't need everyone to have an account to add them to an event.
- To deploy: host `server/` (e.g. Render/Railway) with a MongoDB Atlas URI,
  build `client/` with `npm run build` and serve the `dist/` folder (e.g.
  Vercel/Netlify), pointing `VITE_API_URL` at your deployed API.

## Feature-complete upgrade

This version keeps the existing `client/src/index.css` unchanged and extends the application with:

- Groups/events with member access control
- Registered-user linking when adding members by email
- Equal, exact-amount, and percentage expense splitting
- Per-participant stored shares for accurate historical calculations
- Balance calculation and simplified debt settlement suggestions
- Recorded settlements with undo support
- In-app notifications for expenses, invitations, and settlements
- Notification center with mark-read/mark-all-read
- Profile and settings including currency and notification preferences
- Dashboard totals for what the current user owes and should receive
- Protected group access so authenticated users cannot open arbitrary groups
