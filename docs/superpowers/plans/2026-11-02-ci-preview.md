# CI and preview repair implementation plan

**Goal:** Restore reliable CI checks and report only verified preview deployments.

**Scope:** User-approved first two audit items: stale SEO artifacts, time-dependent workflow test, and staging workflow failures. No production deploy or dependency updates.

1. Reproduce stale SEO and workflow test failures; pin the workflow tests' clock and regenerate sitemap/robots using the existing generator.
2. Repair staging checkout and branch selection, use Cloudflare action outputs for verification and summary links, and skip publication steps without credentials. Remove the failing PR-comment operation instead of broadening token permissions.
3. Run root/admin suites, SEO and formatting checks, validate workflow syntax, inspect the complete diff, and open a PR from current main.

**Ruling after CI:** Main received a content update during verification. Merge it without overwriting content and regenerate SEO again. The artifact-sync workflow omitted the SEO generator and validated before generation; generate SEO in that same workflow and validate after generation to avoid repeatedly leaving stale SEO artifacts.

**Verification:** Confirm scheduled cancellation still has the expected message at a controlled time; confirm all tests pass; exercise workflow shell scripts with slash-containing branch names, deployment URLs, and absent credentials. Cloudflare Git integration remains available when Actions credentials are absent.
