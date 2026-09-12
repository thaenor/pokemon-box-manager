---
status: active
ticket: "#5"
---

## Task: Project Scaffold & Firebase Setup

### Acceptance Criteria

1. **Project structure**
   - `index.html` — entry point with PWA manifest `<link>` and SW registration `<script>`
   - `css/style.css` — base styles (reset, variables, layout)
   - `js/firebase-config.js` — Firebase config with the user's project credentials
   - `js/app.js` — main application entry point
   - `images/` — directory for icons and sprites
   - `manifest.json` — PWA manifest (name "Pokémon Box Manager", theme_color #1A1A2E, display standalone, at least 192x192 and 512x512 icons)
   - `sw.js` — Service Worker with cache-first for static assets

2. **Firebase Hosting**
   - `firebase.json` — Firebase Hosting config pointing to project root
   - `.firebaserc` — pointing to `pokemon-box-manager` project
   - Firebase config values from the user's project (apiKey, authDomain, projectId, etc.)

3. **Git setup**
   - Branch: `scaffold/initial-setup`
   - All files committed
   - Ready for PR

### Firebase Config
```js
const firebaseConfig = {
  apiKey: "AIzaSyA9nd1RsWNb4GB0LLBsUvJMRsWCdoy8IVk",
  authDomain: "pokemon-box-manager.firebaseapp.com",
  projectId: "pokemon-box-manager",
  storageBucket: "pokemon-box-manager.firebasestorage.app",
  messagingSenderId: "645423843887",
  appId: "1:645423843887:web:c7290dc720a05791e9d4da"
};
```

### Notes
- Vanilla HTML/CSS/JS — no build step
- Use v9 Firebase SDK (compat mode via CDN)
- PWA icons can use placeholder SVGs initially (will swap later)
- Service Worker should use workbox-like pattern but manual (no build step)
- The Firebase config should be loaded from a separate JS file
- Firestore collections are planned but NOT wired yet (just add the SDK import)
