# Token Refresh Fix - Implementation Checklist ✅

## Backend Implementation - COMPLETE ✅

- [x] Created `backend/accounts/views/auth_token.py`
  - Dedicated refresh token handler
  - Validates tokens properly
  - Generates new access + refresh tokens
  - Full error handling

- [x] Updated `backend/backend/urls.py`
  - Added `/auth/refresh/` route
  - Imports refresh handler

- [x] Syntax validation
  - All Python files compile without errors

## What You Need to Do

### 1. Frontend Update (Required)

- [ ] Update `frontend/app/api/auth/refresh/route.ts`
  - Change: `/auth/token/` → `/auth/refresh/` (line 61)
  - File location in IMPLEMENT_TOKEN_REFRESH_FIX.md
  - Takes ~2 minutes

### 2. Verify Configuration (Required)

- [ ] Check OAuth2 app exists
  ```bash
  python manage.py shell
  from oauth2_provider.models import Application
  print(Application.objects.count())  # Should be >= 1
  ```

- [ ] If app doesn't exist, create it
  ```bash
  python manage.py create_oauth_app
  ```

- [ ] Note client_id and client_secret
  - Set as DJANGO_OAUTH_CLIENT_ID in frontend env
  - Set as DJANGO_OAUTH_CLIENT_SECRET in frontend env

### 3. Testing (Recommended)

- [ ] Test 1: Login returns refresh_token
  ```bash
  curl -X POST http://localhost:8000/auth/token/ \
    -H "Content-Type: application/json" \
    -d '{...grant_type: password...}'
  # Response should include: "refresh_token": "..."
  ```

- [ ] Test 2: Refresh endpoint works
  ```bash
  curl -X POST http://localhost:8000/auth/refresh/ \
    -H "Content-Type: application/json" \
    -d '{...grant_type: refresh_token...}'
  # Response should include new access_token + refresh_token
  ```

- [ ] Test 3: Verify database tokens
  ```bash
  python manage.py shell
  from oauth2_provider.models import RefreshToken
  user = RefreshToken.objects.first()
  print(f"Tokens count: {RefreshToken.objects.count()}")
  ```

### 4. Frontend Testing (Recommended)

- [ ] Log in and check browser console
- [ ] Should see "[auth] JWT check" messages
- [ ] Wait 5 minutes
- [ ] Should see "[auth] Token refreshed successfully"
- [ ] Stay logged in past 1 hour without re-login

### 5. Restart Services

- [ ] Restart Django: `python manage.py runserver`
- [ ] Restart Next.js: `npm run dev`
- [ ] Clear browser cache/session if needed

## Files to Check

| File | Status | Notes |
|------|--------|-------|
| `backend/accounts/views/auth_token.py` | ✅ Created | New file - ready to use |
| `backend/backend/urls.py` | ✅ Updated | Route added - ready |
| `frontend/app/api/auth/refresh/route.ts` | ⏳ Awaiting update | You update this |
| `.env` (frontend) | ⏳ Check | Verify OAuth2 credentials |

## Timeline

- [ ] Spend 5 minutes updating frontend file
- [ ] Spend 2 minutes verifying OAuth2 app
- [ ] Spend 5 minutes testing (curl commands)
- [ ] Spend 5 minutes frontend testing
- [ ] Done! ✅

**Total time: ~15 minutes**

## Success Criteria

- [ ] Login returns `refresh_token` in response
- [ ] `/auth/refresh/` endpoint returns 200 with new tokens
- [ ] Frontend session updates automatically
- [ ] User stays logged in past 1 hour
- [ ] No 401 errors when access token expires
- [ ] User can stay logged in for 30 days

## Troubleshooting Quick Links

- 401 on refresh? → See TOKEN_REFRESH_TROUBLESHOOTING.md
- Confused about flow? → See TOKEN_REFRESH_COMPLETE_FIX_SUMMARY.md
- Step-by-step guide? → See IMPLEMENT_TOKEN_REFRESH_FIX.md
- DB not showing tokens? → Run `python manage.py shell` diagnostic

## Support Files

All documentation is in `backend/`:
- `TOKEN_REFRESH_COMPLETE_FIX_SUMMARY.md` - Overview
- `TOKEN_REFRESH_TROUBLESHOOTING.md` - Root cause analysis
- `IMPLEMENT_TOKEN_REFRESH_FIX.md` - Step-by-step guide

---

**Questions?** Check the documentation files or run the diagnostic commands above.
