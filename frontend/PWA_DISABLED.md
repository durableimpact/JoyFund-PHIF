# PWA Disabled - Caching Issues Resolution

## Summary
Progressive Web App (PWA) functionality has been **disabled** throughout the project to prevent caching issues that were preventing pages from fetching fresh data.

## Changes Made

### 1. **Service Worker** (`frontend/public/sw.js`)
- ✅ All service worker code is commented out
- ✅ No active caching strategies in effect
- ✅ Contains original code for future re-enabling

### 2. **Service Worker Registration** (`frontend/components/pwa/RegisterServiceWorker.tsx`)
- ✅ Component still exists but returns `null`
- ✅ All registration logic is commented out
- ✅ Safe to keep in code - does nothing when rendered

### 3. **App Layout** (`frontend/app/layout.tsx`)
- ✅ Import of `RegisterServiceWorker` is commented out
- ✅ Manifest link tag is commented out
- ✅ PWA meta tags are commented out:
  - `rel="manifest"`
  - `theme-color`
  - `apple-mobile-web-app-capable`

### 4. **Web App Manifest** (`frontend/app/manifest.json`)
- ✅ File still exists but PWA features are disabled
- ✅ Changed `display` from `"standalone"` to `"browser"`
- ✅ Added note about PWA being disabled

## Impact
- ✅ **No more cache-related data fetching issues**
- ✅ Pages will always fetch fresh data from the server
- ✅ Service worker is completely inactive
- ✅ Browser's default cache behavior applies

## Re-enabling PWA (Future)
When the caching strategy is reviewed and improved, you can re-enable PWA by:

1. Uncomment the service worker registration in `frontend/components/pwa/RegisterServiceWorker.tsx`
2. Uncomment the service worker code in `frontend/public/sw.js`
3. Uncomment the import in `frontend/app/layout.tsx`
4. Uncomment the manifest link in `frontend/app/layout.tsx`
5. Change manifest display back to `"standalone"`

## Notes
- All original PWA code is preserved and commented
- No files were deleted - easy to re-enable when ready
- Current configuration is safe and won't cause caching conflicts
- TODO: Review cache strategy before re-enabling
