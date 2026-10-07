# Sources and provenance

Reviewed 7 October 2026. Provider interfaces can change; follow the named setting/function rather than an assumed button position. These references support setup choices and competitive context; they do not prove our app is implemented.

## Official platform references

- [Supabase password sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithpassword): browser email/password authentication.
- [Supabase users](https://supabase.com/docs/guides/auth/users): user identity and getUser.
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): table access, grants, and ownership policies.
- [Render Express deployment](https://render.com/docs/deploy-node-express-app): web-service build and start commands.
- [Render web services](https://render.com/docs/web-services): port binding and service behaviour.
- [Render troubleshooting](https://render.com/docs/troubleshooting-deploys): logs, start commands, and 0.0.0.0.
- [Render free-service limits](https://render.com/docs/free): idle sleep, startup delay, ephemeral local disk. Persist app data in Supabase.
- [Vercel Vite](https://vercel.com/docs/frameworks/frontend/vite): frontend framework deployment.
- [Vercel monorepos](https://vercel.com/docs/monorepos): selecting the correct Root Directory.
- [Vite setup](https://vite.dev/guide/): compatible runtime requirements and scaffold.
- [Vite environment variables](https://vite.dev/guide/env-and-mode): VITE_ exposure and build-time substitution.
- [Render Node version](https://render.com/docs/node-version): explicit NODE_VERSION and supported version selection.
- [Vercel Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions): Node 24.x availability and package engines.
- [Antigravity artifacts](https://antigravity.google/docs/artifacts): review plans, changes, and execution evidence.

## Problem context and competition

- [Habitica features](https://habitica.com/static/features): gamification already exists.
- [Reclaim rescheduling](https://help.reclaim.ai/en/articles/6937489-auto-rescheduling-settings-for-tasks-and-habits): automatic rescheduling already exists.
- [LeetCode study plans](https://leetcode.com/discuss/post/3482910/feature-updates-plan-your-coding-journey-to-achieve-more/): organised coding practice already exists.
- [Google's GSoC guidance](https://developers.google.com/open-source/gsoc/faq): future open-source track must include community/project engagement; no selection guarantee.
- [Devpost judging guidance](https://info.devpost.com/blog/understanding-hackathon-submission-and-judging-criteria): common criteria; the event's actual rubric overrides these.

## Project history used cautiously

Prior BuildToShip workshop notes identified common failures: wrong API host, Vite env changes requiring rebuild, CORS origins, health being mistaken for database proof, and port conflicts. The new kit verifies provider guidance and deliberately chooses a different DB access method: Supabase HTTP client rather than direct DATABASE_URL/pooler configuration. No old application was restored or reused.

## Planning-kit status

The original parent Git repository had tracked deletions at creation time. The kit is confined to its new folder. Source documents, draft SQL, environment placeholders, and synthetic fixtures are prepared. App implementation and live deployment remain future work until recorded in handoffs.
