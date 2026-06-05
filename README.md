# 📅 Reservation Management System

A Single Page Application (SPA) for managing workspace reservations. Users can log in, create and manage their own reservations, while administrators have full control over all records in the system.

---

## 🛠 Technologies

| Technology | Version | Purpose |
|---|---|---|
| Vite | ^5.0 | Build tool & dev server |
| Vanilla JavaScript (ES Modules) | ES2022 | Application logic |
| Pure CSS | — | Styling (no framework) |
| JSON Server | ^0.17.4 | Mock REST API |
| Axios | ^1.6.0 | HTTP client |
| Bootstrap Icons | 1.11.3 | Icon library (CDN) |

---

## ⚙️ Installation

**Prerequisites:** Node.js 18+ and npm installed.

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd <project-folder>

# 2. Install dependencies
npm install
```

---

## ▶️ Running the Project

This project requires **three terminals** running simultaneously.

**Terminal 1 — Auth Server (users & roles):**
```bash
npm run auth-server
# Running at http://localhost:3001
```

**Terminal 2 — Data Server (reservations):**
```bash
npm run data-server
# Running at http://localhost:3002
```

**Terminal 3 — Vite Dev Server:**
```bash
npm run dev
# App available at http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗄️ Running JSON Server

The project uses two separate JSON Server instances to simulate a real backend:

| Instance | Command | Port | Database file | Resources |
|---|---|---|---|---|
| Auth | `npm run auth-server` | 3001 | `auth-db.json` | `/users` |
| Data | `npm run data-server` | 3002 | `data-db.json` | `/reservations` |

**Example requests:**
```
GET    http://localhost:3002/reservations
GET    http://localhost:3002/reservations?userId=2
POST   http://localhost:3002/reservations
PATCH  http://localhost:3002/reservations/:id
DELETE http://localhost:3002/reservations/:id
```

**Reservation object shape:**
```json
{
  "id": 1,
  "userId": 2,
  "workspace": "Room A",
  "date": "2026-01-15",
  "startHour": "08:00",
  "endHour": "09:00",
  "reason": "Sprint Planning",
  "status": "pending"
}
```

> **Status values:** `pending` · `confirmed` · `cancelled` · `done`

---

## 👤 Test Users

Defined in `auth-db.json`. Use these credentials to test each role:

| Role | Username | Password |
|---|---|---|
| Admin | `admin1` | `admin123` |
| Client | `user1` | `user123` |

> To add more users, edit `auth-db.json` directly or use the registration form (creates `cliente` role only).

---

## 📁 Project Structure

```
project/
├── index.html                  # App shell — single HTML entry point
├── auth-db.json                # JSON Server database — users & roles
├── data-db.json                # JSON Server database — reservations
├── package.json
├── vite.config.js
└── assets/
    ├── css/
    │   └── styles.css          # All styles — pure CSS, no framework
    └── js/
        ├── app.js              # Entry point — initializes router, navbar, events
        ├── router.js           # Client-side SPA router with role-based guards
        ├── components/
        │   ├── navbar.js       # Role-aware navigation bar
        │   └── reservationCard.js  # Card component for a single reservation
        ├── middleware/
        │   └── authMiddleware.js   # Route guard — checks session and role
        ├── pages/
        │   ├── loginView.js    # Login & register logic
        │   ├── adminView.js    # Admin dashboard — full CRUD
        │   └── clientView.js   # Client dashboard — own reservations
        ├── services/
        │   ├── httpClient.js   # Axios instances (auth: 3001, data: 3002)
        │   └── apiService.js   # All API calls (login, CRUD, filters)
        ├── utils/
        │   ├── session.js      # localStorage session management + inactivity timer
        │   └── helpers.js      # loadHTML(), formatDate(), today()
        └── views/
            ├── login.html      # Login form fragment
            ├── register.html   # Register form fragment
            ├── admin.html      # Admin panel fragment + modal
            └── client.html     # Client panel fragment + modal
```

---

## 🔐 Role Permissions

| Action | Admin | Client |
|---|---|---|
| View all reservations | ✅ | ❌ |
| View own reservations | ✅ | ✅ |
| Create reservation | ✅ | ✅ |
| Edit any reservation | ✅ | ❌ |
| Edit own reservation (pending only) | ✅ | ✅ |
| Delete reservation | ✅ | ❌ |
| Filter & search reservations | ✅ | ❌ |
| Access `/admin` route | ✅ | ❌ |
| Access `/cliente` route | ❌ | ✅ |

> Attempting to access a route outside your role returns an **Access Denied** screen. The router enforces this on every navigation, including browser back/forward buttons.

---

## 🧠 Technical Decisions

**SPA with History API**
Navigation uses `history.pushState()` instead of hash routing, giving clean URLs (`/admin`, `/cliente`). The router runs on every `popstate` event to handle the browser back button correctly.

**Two JSON Server instances**
Auth and data are split into separate ports (3001 / 3002) to simulate a real architecture where user management and business data live on different services. This makes it straightforward to swap one out independently.

**Session via localStorage**
The session object (id, name, rol) is stored in `localStorage` under a single key. This persists across page reloads without requiring a backend session. An inactivity timer (5 minutes) automatically clears the session and redirects to login.

**HTML views as fetch fragments**
Each view is a plain `.html` file loaded with `fetch()` and injected into `<main id="content">`. This keeps the JS files focused on logic and avoids large template strings in JS.

**Pure CSS — no framework**
Bootstrap was removed entirely. All styles live in a single `assets/css/styles.css` file built around CSS custom properties. Changing the color scheme requires editing only 3 variables at the top of the file. Modals are driven by a `.open` class toggle instead of a JS library.

**Axios interceptors**
Both HTTP clients log every request and response error to the console, making it easy to debug during development without adding extra tooling.