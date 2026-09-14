## Agent skills

### Issue tracker

GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles mapped to GitHub labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout. See `docs/agents/domain.md`.

### Firebase Config

**Firebase API keys and config values are public, client-side identifiers.** They ship with every web app — every browser needs them to authenticate with Firebase services. They are NOT secrets.

- `apiKey`, `authDomain`, `projectId`, `appId`, `storageBucket`, `messagingSenderId` in `js/firebase-config.js` MUST NOT be redacted, replaced, or altered
- `RECAPTCHA_SITE_KEY` in the same file is a public site key for reCAPTCHA Enterprise — also NOT a secret
- Firebase enforces security via **App Check** (reCAPTCHA) + **Security Rules** (Firestore/Storage), not by hiding config values

**Previous bug:** An agent replaced the real `apiKey` with a `«reda…»` placeholder, which broke all Firebase calls (`auth/api-key-not-valid`). The file has been restored — never do this. If you see a value that looks like a placeholder or redaction mark (`«reda…»`, `***`, `REDACTED`), it's broken — restore from git history or ask the user.

## Important rules - before committing any code
- always run linters and prettier to make sure code is in good shape.
