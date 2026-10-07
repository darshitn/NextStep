# UI and authentication integration audit — 7 October 2026

Integrated UI commit 18df842 from codex/dashboard-layout with authentication baseline 3d1ac34 and authentication runbook commit 8e093c8. Resolved the sole merge conflict by retaining both handoff entries. No environment files were modified.

## Findings and repairs

- The signup adapter previously described every 429 as repeated signup attempts. It now distinguishes over_email_send_rate_limit with a project-wide confirmation-email message. Added a provider-response regression test. This improves diagnosis; it does not increase Supabase's quota.
- Fake Supabase URL/key defaults were available outside tests. They are now restricted to the Node test runner. Missing real configuration triggers the existing configuration failure path rather than a request to supabase.local.
- Authentication implementation was already in the shared baseline; the remaining uncommitted auth changes were documentation. UI merge preserves those source files.

## Evidence

- Server tests: 37 passed, 0 failed (integrated branch).
- Client tests after auth repair: 34 passed, 0 failed.
- Production build after final auth repair: passed in 17.98 seconds. The sandbox initially blocked file resolution; the permitted rerun succeeded.
- Planning kit: 7 groups passed, 0 failed.
- Read-only local browser check: signed-in goal loaded with 3/12 completions, current M04, compact Appearance popover, integrated saved notes, full-width progress and deduplicated calendar completion records. No progress writes performed.
- Friend's desktop/mobile six-appearance screenshots and fixture verification are retained in FINAL-LAYOUT-VERIFICATION.md and layout-evidence/. They are prior fixture evidence, not independent live production validation.

## Remaining release checks

Public signup is not release-verified until one real confirmation email returns to the deployed app and the account creates/reloads a goal. The reported signup rate limit requires provider logs to identify its exact cause. Configure the project's mail delivery and redirect settings using 09-supabase-auth-config.md; do not repeatedly retry signup or disable verification as a silent workaround.

Remote RLS, real Gemini reasoning assessment, and deployment were not reverified in this audit. Automatic test isolation uses mocked storage. The auth adapter stores refresh tokens but has no automatic token-refresh implementation; sessions may require signing in again after access-token expiry. This remains a known limitation for longer sessions.

Status: local integration checks passed; production acceptance pending. No main merge or cloud deployment performed.
