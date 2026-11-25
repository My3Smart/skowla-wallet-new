## Project rules

- App is two role areas: `/teacher/*` and `/parent/*`, each a layout route with `ssr: false` and a `beforeLoad` session guard; `/` is the shared login. Why: demo auth lives in localStorage, which only exists client-side.
- Login uses hardcoded demo accounts in `src/lib/auth.ts` (no backend auth). Why: user asked for hardcoded teacher/parent logins for testing.
- All app data (students, complaints, wallet, children, invoices, chat) lives in `src/lib/store.ts` (useSyncExternalStore + localStorage); money rules are pure `apply*` functions covered by `src/test/skowla-rules.test.ts`. Why: keeps rules testable without a database.
- Skowla AI chat calls the AI Gateway only from the `askSkowla` server function in `src/lib/chat.functions.ts`, passing current app data as context. Why: keeps the API key server-side and answers grounded in the app's numbers.
- Shared Skowla UI pieces live in `src/components/skowla/`; colours come from tokens in `src/styles.css` (no raw colour classes). Why: one place to keep the design faithful and dark mode working.
- Times are formatted in Asia/Kuala_Lumpur via `src/lib/format.ts`. Why: school schedule must read the same on every device.
- Skowla is phone-only: Tailwind breakpoints are disabled in `src/styles.css` and `__root` wraps routes in a 430px `.phone-frame`. Why: user wants a phone app, not a laptop layout.
- PWA is manifest-only (`public/manifest.webmanifest`, owl icons) plus an install banner; no service worker. Why: installability without stale-cache risk in previews.
