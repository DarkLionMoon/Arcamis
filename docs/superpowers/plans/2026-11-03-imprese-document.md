# Imprese: replace the text and preserve the original graphics

Source: https://docs.google.com/document/d/1XFhXbdGz9U0kOQxJfGdUmarjiTXxP4YA2Aa1pu_gZkA/edit

The user explicitly requires the original graphics. Keep layout=imprese,
its two top tabs, sidebar/mobile drawer, card types, tables, colours, fonts
and all CSS. Replace content within the existing sections: overview and
foundation requirements; four level cards; foundation examples in Procedura;
new cash-fund and contract rules in Entrate; roleplay/expeditions in Riferimenti;
licence overview, table and individual cards in Licenze & Patenti. Preserve
uncovered sections (Inchiostri) and the existing admin interface.

The supplied Markdown remains page.content for editing/search/provenance.
The app distributes its sections into the existing components. Structured
levels and licence recipients match the new document. No new explore tabs.
The user resolved the Alchemist example: Bottega Artigiana, permit480MO,
total1660MO. The450MO example uses explicit parentheses, unchanged result.

Verify source coverage and all existing navigation, stylesheet/admin diffs
against167f6f1 must be empty, mobile/desktop visual comparison with the
production version, root/admin tests and CI. Deliver a corrected preview;
do not merge to production until requested.
