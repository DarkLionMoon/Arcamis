# Species page polish

Approved: correct maintenance/banner spacing; place Ascesi introduction in a collapsible note outside the catalogue; keep compact summary badges and full age prose; mobile filter targets >=44px; repair malformed Markdown and Italian distance labels. Preserve Tipologia values, numeric rules, images and the existing visual system. No internal table of contents (awaiting user preference); no new imagery.

Implementation: actual banner offsetHeight with ResizeObserver and one body offset; one disclaimer acceptance handler. Existing note disclosure styling reused for Ascesi. Optional per-page summaryFields limits summary badges without changing other pages; species-only mobile selector.

Verification: regression tests RED/GREEN for first-visit banner spacing and preserved age text; 32 species with original groups and a note; exact original Tipologia values and numeric tokens; test desktop/mobile geometry, banner close/reload, 44px targets and no horizontal overflow; site/admin tests, build, CI and preview. Publication remains subject to the user's next approval.
