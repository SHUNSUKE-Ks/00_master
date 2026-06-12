# note00-gallerynotedb_vol1.1 Dev Start

## Project

- Name: note00-gallerynotedb_vol1.1
- Base clone: git@github.com:SHUNSUKE-Ks/nacc_system.git
- Local path: C:/Users/enjoy/InBox2026/InBox0601/06_AppList/note00-gallerynotedb_vol1.1
- Goal: generic note app with Gallery, DB, and Relation views

## Initial Preparation

- Rename app/package/PWA metadata away from NACC
- Remove NACC product/nutrient/gallery sample data
- Keep the Gallery / DB / Relation structure as reusable scaffolding
- Add isolated UPNOTE feature area under `src/features/upnote`
- Keep old memo/notebook features for reference until UPNOTE notes are stable

## Upnote Feature Boundary

`src/features/upnote` is the first dedicated boundary for the reusable note feature.

Current files:

- `types.ts`: note and UI state types
- `state.ts`: Solid store and state actions
- `index.ts`: public exports

## User State Model

```json
{
  "activeSurface": "editor",
  "activeNoteId": null,
  "selectionMode": "none",
  "selectedNoteIds": [],
  "editorMode": "idle",
  "sidePanel": "tags",
  "filterTags": [],
  "relationFocusId": null,
  "isDirty": false
}
```

This state is intended to support later shortcuts such as:

- editor-only writing shortcuts
- side-panel navigation shortcuts
- gallery selection shortcuts
- relation focus movement
- dirty-state save prompts

## Data Policy

NACC source data is removed from the cloned app. Structure is retained where useful.

Removed or emptied:

- product sample records
- nutrient sample records
- gallery sample item
- initial blog sample records

Not removed yet:

- old memo / notebook implementation
- DB pages and relation-like pages
- Firebase adapter

## Next Work

1. Build and verify the renamed app
2. Rename DB pages from product/nutrient language to note/tag/relation language
3. Connect UPNOTE state to a first editor component
4. Decide whether Firebase stays, is renamed, or is wrapped behind a local adapter
5. Replace PWA icons with note00-specific icons
