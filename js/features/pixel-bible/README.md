# Pixel Bible module map

- `world.js` assembles the playable world; rendering, movement, appearance, object behavior, and dialogue rules are in neighboring focused modules.
- `context-monologues.js` is the entry point for chapter-aware character lines. `nt-dialogue.js` stores New Testament lines; `ot-dialogue/` stores Old Testament lines grouped by canon section. `ot-dialogue.js` remains a compatibility entry point.
- `object-catalog.js`, `object-scenes.js`, `object-usage.js`, and `object-response.js` separate object definitions, authored events, action selection, and results.
- `appearance.js`, `garments.js`, `wardrobe.js`, `physique.js`, and `creatures.js` hold character identity and visual traits.
- `interaction-motion.js`, `action-tracks.js`, and `additional-actions.js` hold interaction and movement animation behavior.

When adding Old Testament dialogue, add rows to the matching section under `old-testament/`; keep the six-field row shape and do not include source scripture or commentary text.
