# JoyFund — Solidarity Health Bridge 🇨🇲

JoyFund is a web platform that bridges celebration and solidarity in Cameroon.
Donors create milestone campaigns (birthdays, weddings, graduations) that channel
gift funds directly to maternal healthcare for underprivileged beneficiaries —
verified by social workers and disbursed through a PIN-protected hospital voucher system.

> **Status:** Frontend complete · Django backend integration in progress

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Portals & Routes](#portals--routes)
4. [Prerequisites](#prerequisites)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [Authentication Flow](#authentication-flow)
8. [Connecting the Django Backend](#connecting-the-django-backend)
9. [Available Scripts](#available-scripts)
10. [Contributing](#contributing)

---

## Tech Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Framework   | Next.js 14 (App Router)                  |
| Language    | TypeScript                               |
| Styling     | Tailwind CSS v3                          |
| State       | Zustand (with `persist` middleware)      |
| Icons       | Lucide React                             |
| Backend     | Django + Django REST Framework *(planned)* |
| Auth        | djangorestframework-simplejwt *(planned)* |
| Payments    | MTN Mobile Money / Orange Money *(planned)* |

---

## Project Structure
joyfund/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Public landing page
│   ├── explore/                # Browse all campaigns
│   ├── login/                  # Sign in (all roles)
│   ├── register/               # Donor self-registration
│   ├── forgot-password/        # Request reset code
│   ├── reset-password/         # Enter code + set new password
│   ├── dashboard/              # Donor dashboard
│   ├── create/                 # Create a new campaign (4-step)
│   ├── history/                # Donor contribution history
│   ├── campaign/[id]/          # Public campaign detail page
│   ├── donate/[id]/            # Donation flow (MoMo/Orange)
│   ├── social-worker/
│   │   ├── dashboard/          # SW overview
│   │   ├── enroll/             # Enroll a new beneficiary → BEN-XXXX
│   │   └── beneficiary/[id]/   # Beneficiary detail
│   ├── hospital/
│   │   ├── receptionist/       # Validate voucher → lock funds
│   │   └── nurse/              # PIN confirmation → trigger payout
│   ├── hospital-admin/
│   │   ├── dashboard/
│   │   ├── staff/
│   │   └── transactions/
│   ├── admin/
│   │   ├── dashboard/          # Live feed, approvals
│   │   ├── hospitals/
│   │   ├── analytics/
│   │   └── vouchers/
│   └── api/                    # Next.js route handlers (proxy to Django)
│       └── auth/
│           ├── login/
│           ├── register/
│           ├── forgot-password/
│           ├── verify-reset-code/
│           └── reset-password/
├── components/
│   ├── shared/
│   │   ├── Navbar.tsx
│   │   ├── CampaignCard.tsx
│   │   └── Toast.tsx
│   └── ui/
├── lib/
│   ├── mockData.ts             # All static seed data (campaigns, vouchers, etc.)
│   └── utils.ts
├── store/
│   └── useStore.ts             # Zustand global store (auth + all domain state)
├── middleware.ts               # Route protection (redirects unauthenticated users)
├── next.config.ts
└── tailwind.config.ts

---

## Portals & Routes

| Portal | URL | Who accesses it |
|---|---|---|
| Public Landing | `/` | Everyone |
| Explore Campaigns | `/explore` | Everyone |
| Sign In | `/login` | All roles |
| Register | `/register` | Donors only (self-service) |
| Forgot Password | `/forgot-password` | All roles |
| Reset Password | `/reset-password` | All roles |
| Donor Dashboard | `/dashboard` | Donor |
| Create Campaign | `/create` | Donor |
| Campaign Detail | `/campaign/[id]` | Everyone |
| Donate | `/donate/[id]` | Contributor / Donor |
| Social Worker | `/social-worker/dashboard` | Social Worker |
| Beneficiary Enroll | `/social-worker/enroll` | Social Worker |
| Receptionist | `/hospital/receptionist` | Receptionist |
| Nurse Payout | `/hospital/nurse` | Nurse |
| Hospital Admin | `/hospital-admin/dashboard` | Hospital Admin |
| System Admin | `/admin/dashboard` | System Admin |

---

## Prerequisites

Make sure the following are installed on your machine before you begin.

- **Node.js** v18 or higher — [Download](https://nodejs.org)
- **npm** v9+ (comes with Node) or **yarn** / **pnpm**
- **Git** — [Download](https://git-scm.com)

To verify your versions:

```bash
node -v
npm -v
git --version
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-org/joyfund.git
cd joyfund
```

> Replace `your-org/joyfund` with your actual GitHub repository path.

### 2. Install dependencies

```bash
npm install
```

This installs everything listed in `package.json`:
`next`, `react`, `tailwindcss`, `zustand`, `lucide-react`, `typescript`, and their peer dependencies.

### 3. Set up environment variables

Create a `.env.local` file at the root of the project:

```bash
cp .env.example .env.local
```

If `.env.example` does not exist yet, create `.env.local` manually:

```bash
touch .env.local
```

Then open it and fill in the values (see [Environment Variables](#environment-variables) below).

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The app runs in **mock mode** by default — no backend is required. All data is
served from `lib/mockData.ts` and state is managed entirely in Zustand.

### 5. Explore the app

Use the table below to navigate the demo. Go to `/login` and click any role card
to enter the corresponding portal instantly.

| Demo action | Where to go |
|---|---|
| See the platform | `/` |
| Browse campaigns | `/explore` |
| Create a campaign | `/login` → Donor → `/create` |
| Donate with MoMo | `/explore` → any campaign → Give a Gift |
| Enroll a beneficiary | `/login` → Social Worker → `/social-worker/enroll` |
| Validate a voucher | `/login` → Receptionist → type `JF9M4P` |
| Release a payout | `/login` → Nurse → select patient → PIN `2947` |
| Platform overview | `/login` → System Admin → `/admin/dashboard` |

---

## Environment Variables

Create `.env.local` at the project root. All variables prefixed `NEXT_PUBLIC_`
are exposed to the browser; the rest are server-only.

```env
# ── Django backend base URL ──────────────────────────────────────────────────
# Point this to your running Django API. Used by the Next.js API route handlers
# in app/api/auth/** to proxy requests to Django.
# Leave empty to stay in mock mode (no backend needed).
DJANGO_API_URL=http://localhost:8000

# ── App public URL ───────────────────────────────────────────────────────────
# Used to build absolute URLs (e.g. email links). Change for staging/production.
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ── Optional: environment label ──────────────────────────────────────────────
# Shown in the UI when set to "development" (displays a "Demo Mode" badge).
NEXT_PUBLIC_ENV=development
```

> **Never commit `.env.local` to Git.** It is already listed in `.gitignore`.

---

## Authentication Flow

The frontend is fully wired for JWT authentication (djangorestframework-simplejwt).
Here is how the pieces connect:
User submits login form
│
▼
app/api/auth/login/route.ts        ← Next.js route handler (server-side proxy)
│  POST { email, password }
▼
Django  /api/auth/token/            ← simplejwt TokenObtainPairView
│  returns { access, refresh, user }
▼
useStore.login({ access, refresh, user })
│  persists to localStorage via Zustand persist
▼
Router.push(ROLE_HOME[user.role])  ← per-role redirect map
**Token refresh** — when an access token expires (default 5 min), call
`/api/token/refresh/` with the stored `refreshToken`, then call
`useStore.getState().setAccessToken(newAccess)`.

**Route protection** — `middleware.ts` reads the `joyfund_token` cookie and
redirects unauthenticated users to `/login` for any protected path.

**Password reset flow:**
/forgot-password  →  POST email to Django  →  Django sends 6-digit code by email
│
▼
/reset-password   →  enter 6 boxes  →  POST verify code  →  POST new password
│
▼
/login  (success redirect)
---

## Connecting the Django Backend

When your Django project is ready, you only need to update the three API route
handler files — the frontend pages do not change at all.

### Step 1 — Set the base URL

In `.env.local`:

```env
DJANGO_API_URL=http://localhost:8000
```

### Step 2 — Uncomment the fetch calls

Open each file and uncomment the `fetch(...)` block, then remove the mock return.

| Next.js route handler | Django endpoint |
|---|---|
| `app/api/auth/login/route.ts` | `POST /api/auth/token/` |
| `app/api/auth/register/route.ts` | `POST /api/auth/register/` |
| `app/api/auth/forgot-password/route.ts` | `POST /api/auth/password-reset/` |
| `app/api/auth/verify-reset-code/route.ts` | `POST /api/auth/password-reset/verify/` |
| `app/api/auth/reset-password/route.ts` | `POST /api/auth/password-reset/confirm/` |

### Step 3 — Recommended Django packages
djangorestframework
djangorestframework-simplejwt
django-rest-passwordreset
django-cors-headers
Minimum `settings.py` additions:

```python
INSTALLED_APPS += [
    'rest_framework',
    'corsheaders',
    'django_rest_passwordreset',
]

MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware', ...MIDDLEWARE]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}
```

### Step 4 — Replace mock data with API calls

Once auth is working, replace the Zustand initial state (currently seeded from
`lib/mockData.ts`) with `useEffect` fetch calls that hit your Django REST
endpoints. The store actions (`addCampaign`, `addContribution`, etc.) stay
identical — only the data source changes.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server at `http://localhost:3000` |
| `npm run build` | Build the production bundle |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint across the project |

---

## Contributing

1. Fork the repository and create a feature branch:
```bash
   git checkout -b feat/ivantom
```
2. Make your changes and commit with a clear message:
```bash
   git commit -m "feat: add hospital admin export to CSV"
```
3. Push your branch and open a Pull Request against `main`.
4. All PRs require at least one review before merge.

---

*JoyFund v1.0 · Solidarity Health Bridge · Made with ❤️ in Cameroon 🇨🇲*