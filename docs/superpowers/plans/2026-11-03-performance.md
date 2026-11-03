# Arcamis performance plan

Goal: reduce avoidable downloads and initial waiting without changing graphics, content or navigation. User approved the audited optimizations with a safety constraint.

Work in the existing isolated Imprese worktree; preserve its pending text corrections and do not publish production.

- [ ] Add regression checks for canonical image URLs, one cache policy per hashed resource, and route-specific preloads.
- [ ] Normalize Vite image URLs to the existing canonical root URLs; remove the home cover preload from internal routes.
- [ ] Generate exact cache rules for hashed JS/CSS, replacing overlapping wildcard rules. Preserve revalidation for mutable content/images and all security/admin headers.
- [ ] Dismiss the existing loader on DOM readiness for home and after page rendering for internal routes; retain the load-event fallback. Reserve viewport height for internal-page content to keep footer offscreen while data loads.
- [ ] Run site/admin tests, lint, production build and browser checks; deploy preview and repeat Lighthouse with the same profiles and antivirus-resource exclusions used for baseline.
- [ ] Review the delta, leave invasive JS module splitting for later, report measured changes and limitations.

Acceptance: all existing graphics and patent text corrections retained, no duplicate cover/map downloads, cache responses unambiguous, internal-page CLS improved, tests green. No production publish.
