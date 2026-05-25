# Frontend Route Map

This file maps existing frontend routes to back-end API endpoints and identifies the next non-voucher work to wire up.

## Existing frontend pages and their responsibilities

- `/` — Landing page
- `/explore` — Browse active campaigns
- `/campaign/[id]` — Campaign detail page
- `/donate/[id]` — Donate flow for a specific campaign
- `/login` — Auth login
- `/register` — Donor registration
- `/forgot-password`, `/reset-password` — Password recovery flow
- `/admin/dashboard` — Admin landing page
- `/admin/create-user` — Admin user creation flow
- `/social-worker/dashboard` — Social worker caseload overview
- `/social-worker/enroll` — Beneficiary enrollment form
- `/social-worker/beneficiary/[id]` — Beneficiary profile details
- `/hospital/receptionist` — Receptionist voucher validation
- `/hospital/nurse` — Nurse portal (existing mock)
- `/hospital-admin/dashboard` — Hospital admin landing page

## New server route proxies added

### Campaigns
- `app/api/campaigns/route.ts` — GET `/api/campaigns/`
- `app/api/campaigns/[campaignId]/route.ts` — GET `/api/campaigns/{id}/`
- `app/api/campaigns/[campaignId]/donate/route.ts` — POST `/api/campaigns/{id}/donate/`

### Beneficiaries
- `app/api/beneficiaries/route.ts` — GET `/api/beneficiaries/`, POST `/api/beneficiaries/`
- `app/api/beneficiaries/[beneficiaryId]/route.ts` — GET `/api/beneficiaries/{id}/`

## Backend API endpoints to wire next

### Campaigns
- `GET /api/campaigns/` — campaign list
- `GET /api/campaigns/{id}/` — campaign detail
- `POST /api/campaigns/{id}/donate/` — create donation and initiate payment

### Beneficiaries
- `GET /api/beneficiaries/` — list beneficiaries for the authenticated social worker
- `POST /api/beneficiaries/` — create a beneficiary
- `GET /api/beneficiaries/{id}/` — beneficiary detail

### Accounts
- `POST /api/accounts/donors/register/` — donor registration
- `POST /api/accounts/hospital-admins/` — hospital admin create
- `POST /api/accounts/social-workers/` — social worker create
- `POST /api/accounts/receptionists/` — receptionist create

## Recommended next work

1. Wire `/donate/[id]` to `POST /api/campaigns/{id}/donate/` and handle the returned payment link.
2. Wire `/social-worker/enroll` to `POST /api/beneficiaries/`.
3. Wire `/social-worker/dashboard` to refresh from `GET /api/beneficiaries/` instead of mock data.
4. Add a beneficiary detail API-backed page for `/social-worker/beneficiary/[id]` using `GET /api/beneficiaries/{id}/`.
5. Keep voucher UI as mock until voucher endpoints are ready, then replace receptionist and nurse validation with real backend routes.
