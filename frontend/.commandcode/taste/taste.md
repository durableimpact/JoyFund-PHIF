# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# code-style
- In Next.js App Router detail pages, ensure all sibling JSX elements in a `return` statement are wrapped in a fragment (`<>...</>`) — a bare `return` with two sibling elements (like a back button and a content div) causes "Expected ',' got 'ident'" parse errors. Confidence: 0.75
- When using Zod for form validation, display per-field inline errors (e.g., a red text below each input) rather than a single generic error banner — use `safeParse` and map each issue's `path[0]` to the corresponding field for targeted error messages. Confidence: 0.70
- Prefer react-hook-form for form state management instead of manual useState/fieldErrors patterns. Confidence: 0.60

# api
- Action functions (`getHospitalStaff`, `getHospitalReceptionists`, `listBeneficiaries`, `listNotifications`, etc.) return `PaginationResponse<T>` objects with `.results`, not raw arrays — always extract `.results` (with a fallback for legacy array responses) before mapping over the data. Confidence: 0.80
- `listBeneficiaries` wraps its response in a `json` key: `{ json: { count, next, previous, results: [...] } }` — use `data?.json?.results` (or destructure the `json` key) to access the paginated data. Confidence: 0.70

# zod
- This project uses Zod v4, which uses `.issues` (not `.errors`) on the `ZodError` object returned by `safeParse`. Accessing `.errors` will crash. Confidence: 0.70

# api
- Action functions (`getHospitalStaff`, `getHospitalReceptionists`, `listBeneficiaries`, etc.) return `PaginationResponse<T>` objects with `.results`, not raw arrays — always extract `.results` (with a fallback for legacy array responses) before mapping over the data. Confidence: 0.75
- `listBeneficiaries` wraps its response in a `json` key: `{ json: { count, next, previous, results: [...] } }` — use `data?.json?.results` (or destructure the `json` key) to access the paginated data. Confidence: 0.70

# nextjs
- In Next.js 16, the middleware pattern has been replaced by a proxy-based approach — create a proxy/instrumentation instead of a `middleware.ts` file at root. Confidence: 0.70

# git
- Only commit `.env.example` to git, never commit `.env` files — ensure `.gitignore` excludes `.env` but allows `.env.example`. Confidence: 0.70
- Always exclude `*.log` files from git commits — add `*.log` to `.gitignore`. Confidence: 0.70
- When committing multiple files, create one commit per file rather than batching multiple files into a single commit. Confidence: 0.80

