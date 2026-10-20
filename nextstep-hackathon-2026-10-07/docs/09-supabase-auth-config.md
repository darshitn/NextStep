# Supabase Auth Configuration & Return Flow Runbook

This document details the exact Supabase Authentication configuration and email confirmation return flow required for judges and public users to register directly via the NextStep deployed application or local environment.

> **Security Guardrail:** Never use the Supabase `service_role` key in client or Express server application code. Never store plain-text passwords in our application database. All authentication is handled directly by Supabase Auth using the publishable anonymous key.

---

## 1. Supabase Dashboard Settings

Log in to the Supabase Project Dashboard and configure the following under **Authentication**:

### A. URL Configuration (`Authentication` → `URL Configuration`)
- **Site URL**:
  - **Shared production project**: `https://next-step-six-theta.vercel.app`.
  - Keep this public URL even while testing a local copy. Do not switch the shared project's default to localhost.
- **Redirect URLs (Allow list)**:
  - `https://next-step-six-theta.vercel.app/login`
  - `http://localhost:5173/**`
  - `http://localhost:5173/login`
  - `http://localhost:5173/onboarding`
  - `https://<your-project>.vercel.app/**`
  - `https://<your-project>.vercel.app/login`
  - `https://<your-project>.vercel.app/onboarding`

> **Note:** A requested redirect outside the allow-list can fall back to Site URL. Fixing client code alone does not fix a localhost Site URL in the dashboard. Do not remove other existing entries without checking their consumers.

Local live-auth signups now request the public login URL so their email links also work on another device. Hosted HTTPS deployments request their own `/login` origin. Optional `VITE_AUTH_REDIRECT_URL` explicitly overrides this destination; allow-list that exact URL. Use loopback overrides only for intentional development, preferably on a separate Supabase project. Existing `.env` files were not changed; restart Vite after changing a Vite environment setting.

The labelled synthetic preview does not send real Supabase email. Test real signup on the deployed website or normal live-auth development server. The confirmation screen shows the requested return host; it does not verify Supabase's dashboard settings.

### B. Auth Providers (`Authentication` → `Providers` → `Email`)
- **Enable Email provider**: `Enabled` (ON)
- **Confirm email**:
  - In hosted production / judging environments where real email confirmation is enforced, keep `Confirm email` enabled.
  - In development environments without active SMTP, Supabase can return confirmation tokens or auto-confirm depending on settings. The NextStep client cleanly handles **both** outcomes:
    1. **Auto-confirm / Session returned (`confirmationRequired: false`)**: The client automatically logs the user in and navigates directly to `/onboarding`.
    2. **Confirmation required (`confirmationRequired: true`, no session)**: The client displays the **"Check your email"** card with instructions to confirm their email before proceeding. No authenticated session is established until the link is clicked.

### C. Email Templates (`Authentication` → `Email Templates` → `Confirm signup`)
- **Subject**: `Confirm your NextStep account`
- **Body**:
  ```html
  <h2>Confirm your signup</h2>
  <p>Follow this link to confirm your account on NextStep:</p>
  <p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
  ```
- Keep the link's `href` as `{{ .ConfirmationURL }}` so Supabase performs verification. Do not replace it with a direct Site URL, login URL or localhost link. Check custom templates for hardcoded localhost URLs.

After correcting settings, request a fresh confirmation email through the signup flow. An old email retains its old destination and may already be expired or used. Do not share full confirmation links: they contain private tokens.

---

## 2. Confirmation Return Flow Architecture

When a student or judge registers via **Create Account**:

```
[User submits Create Account]
         │
         ├──> Supabase returns session directly?
         │         ├─ YES ──> Store session ──> Navigate to /onboarding
         │         └─ NO  ──> Display "Check your email" confirmation screen
         │
[User opens confirmation email and clicks link]
         │
         ▼
[Browser redirected to <SiteURL>/login#access_token=...&refresh_token=...]
         │
         ▼
[supabaseAuth.checkAuthFromUrl() executes]
         ├── 1. Extracts access_token & refresh_token from window.location.hash
         ├── 2. Stores authenticated session in localStorage (nextstep_supabase_session)
         ├── 3. Strips hash using window.history.replaceState to prevent token leakage
         ├── 4. Emits SIGNED_IN event to listeners
         └── 5. Redirects user to /onboarding to begin goal planning
```

---

## 3. Client & Server Verification Checklist

| Check | Requirement | Verified By |
|---|---|---|
| **No privileged keys** | Client only uses `VITE_SUPABASE_PUBLISHABLE_KEY`, server uses `SUPABASE_PUBLISHABLE_KEY`. `service_role` key is NEVER used. | Code review & tests |
| **Password security** | Passwords are validated client-side (min 6 chars, confirm password match) and processed directly by Supabase Auth. Never sent or stored in app DB. | Client & Unit tests (`AUTH-01`, `AUTH-02`) |
| **Both outcomes handled** | Session returned enters onboarding; confirmation required shows "Check your email" without establishing session. | Unit tests (`AUTH-04`, `AUTH-05`) |
| **Token cleanup** | Hash fragments `#access_token=...` are parsed, stored, and cleared from the browser address bar. | Unit test (`AUTH-03`) |
| **Data isolation** | Second user cannot access or mutate First user's goal or learning context. | Server tests (`NextStep API`, `learningLoop.test.js`) |
