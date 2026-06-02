# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# django-rest-framework
- Use minimal serializers (without nested relations like payment, events) for list/dashboard contexts instead of full detail serializers. Confidence: 0.65
- When creating lightweight list serializers, also optimize the queryset: remove unnecessary prefetch_related() calls and add select_related() for foreign keys used in the serializer. Confidence: 0.70

# django-project-organization
- Place domain-specific views and serializers in their respective Django app (e.g., hospital logic in hospitals/ app, not accounts/ app). Confidence: 0.65
- Use resource ID in URL path (e.g., /hospital/{id}/dashboard/) for resource-specific API endpoints rather than inferring the resource from the authenticated user's profile. Confidence: 0.65

# swagger
- Use "Dashboard" tag (tags=["Dashboard"]) for all dashboard-style API endpoints in drf-yasg swagger_auto_schema decorators. Confidence: 0.65
- Always include a response serializer in swagger_auto_schema responses for API endpoints so the Swagger UI shows the full response shape; avoid bare openapi.Response() descriptions that hide the schema. Confidence: 0.75
- When adding a custom @action (like statistics) to a DRF ViewSet that uses get_serializer_class dispatch, add the action's serializer to get_serializer_class so Swagger can auto-detect the response schema from it. Confidence: 0.70
- For DRF list endpoints that use pagination, remove explicit responses={200: Serializer(many=True)} from @swagger_auto_schema so drf-yasg auto-detects the paginator and generates the proper {count, next, previous, results} schema instead of a flat array. Confidence: 0.70

# project-scope
- Focus only on the backend/ directory; frontend changes are not under the user's responsibility. Confidence: 0.70

# django-caching
- Use @cache_response decorator with a short timeout (e.g., 5 minutes) on user-specific list/action DRF endpoints to avoid repeated DB hits, since the decorator auto-generates keys that include user ID and query params. Confidence: 0.65
- When users are created, invalidate the relevant cache entries to ensure cached list/action endpoints reflect the new user data immediately. Confidence: 0.70
- Implement caching on all relevant DRF endpoints (medical claims, vouchers, services, etc.) using CacheInvalidationMixin or @cache_response since caching is a system-wide requirement. Confidence: 0.85

# api-pagination
- DRF list endpoints return paginated objects with a `.results` property; always extract `.results` (or handle both array and object shapes) when consuming list responses on the frontend. DO NOT assume `.map()` or `.find()` works directly on the return value. Confidence: 0.75
- DRF custom @action endpoints that return lists should always return paginated data via self.get_paginated_response() — do not include a fallback that returns unpaginated Response() when paginate_queryset returns None. Confidence: 0.75

# frontend
- Use typed action functions from @/actions/ instead of raw api.get() calls in pages and components. Confidence: 0.65

# nextjs-auth
- Wrap protected routes in a TokenRefreshProvider that periodically (every ~5 min) checks token expiry and proactively refreshes via the NextAuth JWT callback before the token expires, preventing mid-operation logout. Confidence: 0.65

# nextjs
- For CSS-heavy libraries like Leaflet used with dynamic(ssr: false), import the CSS in the root layout instead of inside the dynamically-imported component to avoid module factory errors. Confidence: 0.65
- When using Leaflet marker icons in Next.js, use CDN URLs (e.g., unpkg) for icon assets instead of importing them, since Next.js/Webpack rewrites the imports into blob/data URLs that Leaflet's L.icon() can't resolve. Confidence: 0.65
- The `update()` function for refreshing NextAuth session data is available via the `useSession()` hook (as `useSession().update()`), not as a standalone export from `next-auth/react`. Confidence: 0.75

# nextjs
- Use Next.js layout.tsx files for shared shell components (sidebar, header, navigation) instead of including them manually in every page. Store reusable layout components in the _components folder of the route group. Confidence: 0.75

# git
- Commit each file as a separate commit (one commit per file), not grouped commits. Confidence: 0.80

# code-fixing
- When a file's imports or structure are badly corrupted, rewrite the file cleanly from scratch instead of using automated regex/scripts that risk introducing cascading errors. Confidence: 0.85

# frontend-actions
- Do not wrap action API function return values with `unwrap` — it strips pagination metadata (e.g., `.results`, `.count`) preventing the frontend from fetching additional pages. Confidence: 0.75
