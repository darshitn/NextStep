# Polished UI checkpoint — 18 October 2026

Branch: `codex/ui-workbench`, based on shared Atlas/Proof baseline `d09e77c`. The owner requested incremental publication during evaluation; this checkpoint publishes the completed local UI work for preservation and collaboration.

## Changes ready for review

- Consistent Tailwind/PostCSS configuration from both launch directories, loopback-only synthetic preview and accurate port handling.
- Compact mobile navigation with keyboard-accessible More menu and deliberate focus restoration.
- Learn / Trace / Reflect studio, explicit server-evaluated predictions, preserved drafts, visible retry and stale-response isolation.
- Grouped Atlas topics with immediate narrow-screen details; starter/curriculum progress clearly distinguished.
- Practice library paginated to 20 entries with retained per-problem drafts.
- Clearer onboarding/starter labels, responsive state visualization and reduced-motion support.
- Updated browser harnesses for sanitized public catalogs, new navigation/modes and meaningful focus/geometry assertions.

## Fresh independent checks at publication

- Client unit suite: 75/75 passed.
- Client production build: passed (67.95 kB CSS and 465.92 kB main JS before gzip).
- Atlas/Proof browser suite: 9/9 passed across seven views, four viewport sizes and six appearance combinations.
- Isolation/error/retry suite: passed, including new Escape-focus, outside-click, destination-focus and mobile geometry assertions. At 390x844, first trace answer starts at document Y=1241.4px and requires 469.4px scroll to reveal completely.
- The two findings in `UI-REBUILD-INDEPENDENT-REVIEW.md` concerning menu focus and mobile first-action access are addressed in this checkpoint; retain that earlier report as review history, not current open-defect status.
- Starter 14-journey suite, cwd styling harness and 107-test server suite had independently passed earlier in this review sequence. Server source and curriculum were not changed by this UI checkpoint. Their earlier results are not represented as fresh production acceptance.

## Release limits

Browser verification uses synthetic accounts/adapters. Live Supabase persistence, Gemini guidance and coordinated Render/Vercel rollout remain separate. The collaborator's remaining curriculum/reference-coverage work is not included or certified here. Earlier exhaustive algorithm-coverage claims remain subject to the shared checkpoint limitations.

A Git branch push preserves code and makes it reviewable; it does not establish that a judge-facing live URL serves this revision. Review the complete integration diff, validate live configuration and deploy frontend/backend together before claiming the upgraded demo is live. Do not merge the collaborator's unfinished branch or change production data to rush evaluation.

## Incremental collaboration

Use focused checked commits and feature branches. Publish completed milestones promptly, then integrate reviewed changes through a PR. Keep `codex/atlas-proof-baseline` stable for the collaborator; they can inspect this UI branch without rebasing their content work until coordinated integration. Secrets, environments, builds, node_modules and local browser profiles/evidence remain excluded.
