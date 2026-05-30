# JoyFund Frontend

Frontend for [JoyFund](https://joy-fund.com) — a transparent crowdfunding platform that turns celebrations into maternal healthcare for vulnerable women across Cameroon.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Auth:** NextAuth v5 (JWT strategy) backed by a Django API
- **State/Data:** React Query, Zustand
- **Forms:** react-hook-form + Zod v4
- **Maps:** Leaflet + react-leaflet
- **Charts:** Recharts
- **Payments:** MTN MoMo, Orange Money

## User Roles

| Role | Description |
|---|---|
| `DONOR` | Creates campaigns, makes donations |
| `SOCIAL_WORKER` | Enrolls beneficiaries, manages health issues |
| `HOSPITAL_ADMIN` | Manages hospital and staff |
| `RECEPTIONIST` | Processes vouchers at hospital |
| `SYSTEM_ADMIN` | Platform administration |

## Getting Started

### Prerequisites

- Node.js 22+
- A running [JoyFund Django backend](https://joy-fund.com)

### Environment Variables

Create a `.env` file:

```bash
NEXTAUTH_SECRET=<random-secret>
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000
NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_ID=<client-id>
NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_SECRET=<client-secret>
AUTH_SECRET=<same-as-nextauth-secret>
```

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

### Docker

```bash
docker compose up --build
```

## Project Structure

```
app/
  (auth)/          # Login, register, forgot/reset password, email verify
  (marketing)/     # Public pages: home, about, explore, campaigns
  (protected)/     # Dashboards per role: donor, social-worker, hospital-admin, receptionist, system-admin
  api/auth/        # NextAuth catch-all route
components/
  dashboard/       # Dashboard-specific components
  global/          # Cross-app components
  shared/          # Shared logic components
  ui/              # shadcn/ui primitives
actions/           # Server actions (API calls to Django backend)
types/             # Global TypeScript declarations
lib/               # Auth helpers, utilities
hooks/             # Custom React hooks
provider/          # React Query and token-refresh providers
```

## License

Private — not for public distribution.
