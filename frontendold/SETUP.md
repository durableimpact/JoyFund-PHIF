## JoyFund Frontend - Setup Guide

### Prerequisites
- Node.js 18+
- Django backend running on `http://localhost:8000`
- PostgreSQL + PostGIS (via Docker or local)

---

### Step 1 - Backend: Run migrations & seed

```bash
cd backendnow
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data --clear --full
```

---

### Step 2 - Backend: Create the OAuth2 Application (CRITICAL)

This step is required exactly once. The frontend uses OAuth2 password grant to
authenticate users. The Application record must exist in your database.

```bash
python manage.py create_oauth_app
```

Output will be:
```
Created OAuth2 Application:
  Name:          JoyFund Frontend
  client_id:     joyfund-frontend
  client_secret: joyfund-secret-dev

Add these to your frontend .env.local:
  DJANGO_OAUTH_CLIENT_ID=joyfund-frontend
  DJANGO_OAUTH_CLIENT_SECRET=joyfund-secret-dev
```

Copy the `create_oauth_app.py` file from the frontend root into:
`backendnow/accounts/management/commands/create_oauth_app.py`

```bash
cp ~/Desktop/JoyFund-PHIF/frontend/create_oauth_app_backend_command.py \
   ~/Desktop/JoyFund-PHIF/backend/accounts/management/commands/create_oauth_app.py
```

---

### Step 3 - Frontend: Configure environment

Create `.env.local` in this directory:

```env
DJANGO_API_URL=http://localhost:8000
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000
DJANGO_OAUTH_CLIENT_ID=joyfund-frontend
DJANGO_OAUTH_CLIENT_SECRET=joyfund-secret-dev
```

---

### Step 4 - Frontend: Install & run

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

### Test Accounts (created by seed_data)

| Role          | Email                          | Password    | Portal                     |
|---------------|--------------------------------|-------------|----------------------------|
| System Admin  | admin@joyfund.com              | Joyfund237  | /admin/dashboard           |
| Donor         | donor@joyfund.com              | password    | /dashboard                 |
| Social Worker | social_worker@joyfund.com      | password    | /social-worker/dashboard   |
| Hospital Admin| hospital_admin@joyfund.com     | password    | /hospital-admin/dashboard  |
| Receptionist  | receptionist@joyfund.com       | password    | /hospital/receptionist     |

---

### Troubleshooting

##### `OAuth error: { error: 'invalid_client' }`
→ The OAuth Application doesn't exist in the database.  
→ Run `python manage.py create_oauth_app` on the backend.

##### `401 Unauthorized` on API calls
→ Token expired or not set. Log out and log back in.

##### `404 Not Found` on `/api/contributions`
→ Harmless. The store tries this endpoint as a fallback - it doesn't exist in this backend. Ignored.

##### Middleware deprecation warning
→ `middleware.ts` → rename to `proxy.ts` (or ignore - it works fine either way in Next.js 16).
