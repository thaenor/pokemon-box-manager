/**
 * Firebase Auth Mock — injects a controllable auth stub into the firebase
 * compat SDK so E2E tests don't need live Google OAuth.
 *
 * This script is injected via page.addInitScript() — it runs before the
 * page's own scripts. Since the `firebase` global doesn't exist yet (CDN
 * scripts haven't loaded), it polls on a timer until firebase appears, then
 * patches it.
 *
 * The Playwright fixture intercepts firebase-auth-compat.js and
 * firebase-app-check-compat.js (serves empty content) so only this mock
 * fills in auth/appCheck.
 *
 * Test controllers set:
 *   window.__authState = <user object|null>     — default: null (unauthenticated)
 *   window.__authError = <error object|null>    — default: null (no error)
 */

(function () {
  if (window.__firebaseAuthMocked) return;

  // ── Build the stub once, install it when firebase is ready ──

  function createAuthStub() {
    const listeners = new Set();

    return {
      _listeners: listeners,

      onAuthStateChanged(callback) {
        listeners.add(callback);
        // Fire synchronously with current state
        const state = window.__authState;
        queueMicrotask(() => callback(state));
        // Return unsubscribe function
        return () => listeners.delete(callback);
      },

      signInWithPopup() {
        return new Promise((resolve, reject) => {
          // When __authDelay is truthy, defer resolution so the test can
          // observe the "Signing in…" loading state before the promise settles
          if (window.__authDelay) {
            window.__authResolve = resolve;
            window.__authReject = reject;
            return;
          }
          const err = window.__authError;
          if (err) {
            reject(err);
          } else {
            resolve({ user: window.__authState || null });
          }
        });
      },

      signOut() {
        window.__authState = null;
        return Promise.resolve();
      },

      GoogleAuthProvider: function GoogleAuthProvider() {
        // constructor stub
      },

      get currentUser() {
        return window.__authState || null;
      },
    };
  }

  function installMock() {
    if (typeof firebase === "undefined") return false;
    if (window.__firebaseAuthMocked) return true;
    window.__firebaseAuthMocked = true;

    const authStub = createAuthStub();

    // Override firebase.auth() to return our stub
    const origAuth = firebase.auth;
    firebase.auth = function () {
      return authStub;
    };
    // Make GoogleAuthProvider accessible from both the function and its return value
    firebase.auth.GoogleAuthProvider = authStub.GoogleAuthProvider;
    // Preserve any extra properties from the original firebase.auth
    if (origAuth) {
      Object.keys(origAuth).forEach((key) => {
        if (!(key in firebase.auth)) {
          firebase.auth[key] = origAuth[key];
        }
      });
    }

    // Signal that App Check should be skipped
    window.__skipAppCheck = true;

    // Set initial auth state
    if (window.__authState === undefined) {
      window.__authState = null;
    }

    // Watch for __authState changes and notify listeners
    let _currentAuthState = window.__authState;
    Object.defineProperty(window, "__authState", {
      get() {
        return _currentAuthState;
      },
      set(newVal) {
        _currentAuthState = newVal;
        authStub._listeners.forEach((cb) => cb(newVal));
      },
      configurable: true,
    });

    return true;
  }

  // Try install immediately (for when firebase already exists)
  if (!installMock()) {
    // Poll until firebase global is available (added by CDN scripts)
    var _check = setInterval(function () {
      if (installMock()) {
        clearInterval(_check);
      }
    }, 10);
    // Safety: stop polling after 30s to avoid hanging
    setTimeout(function () {
      if (_check) clearInterval(_check);
    }, 30000);
  }
})();
