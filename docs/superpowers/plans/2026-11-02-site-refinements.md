# Arcamis: seven approved refinements

Approved scope: update vulnerable dependencies, search individual entries, mobile tables,
remove duplicate metadata, collapse Materiale notes, stable navigation/readability,
descriptive home cards. Preserve imagery, icons, theme and existing content.

Reference lock: current Arcamis desktop/mobile screenshots from the audit; Cinzel
headings, parchment text, gold borders, violet actions. Improve information hierarchy
without adding a second home section or replacing the visual identity.

Implementation order:
1. Update compatible dependencies and selectively migrate incompatible vulnerable tools.
   Run root/admin tests, lint, typecheck, build, and audit. Never use audit fix --force.
2. Add a build-generated collection search index using the existing explorer parser,
   public-page workflow, and hash navigation. Test real Caserma and catalog entries.
3. Mark markdown tables with safe header labels; show wide explorer tables as mobile
   cards, keep two-column tables within the viewport, preserve desktop tables.
4. Remove only leading metadata lines already represented in the displayed badges.
   Preserve metadata elsewhere and any badges hidden by configuration.
5. Wrap Materiale's notes in native details without changing its source content.
6. Select Home independently of its active class; improve secondary copy and rules.
7. Provide descriptive home-card summaries while retaining the existing rail/icons.

Verification: meaningful regression tests before behavior changes; full site/admin
suites, Linux CI build and E2E, visual checks at 320/390px and desktop. Review the
complete branch before delivering a preview. Production publication is out of scope.
