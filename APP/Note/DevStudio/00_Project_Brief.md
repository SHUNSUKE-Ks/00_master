# 00 Project Brief

## Goal

`note00-gallerynotedb_vol1.1` is a generic note app evolved from NACC System.

The app should use the existing Gallery, DB, and Relation-like structures as reusable scaffolding, while removing cosmetic/supplement-specific data and labels.

## Product Direction

The app is not a cosmetic app.

It should become a note workspace where a user can:

- create notes
- tag notes
- browse notes in gallery/card form
- view notes in database form
- connect notes with relation links
- understand the current interaction state
- later use state-specific shortcuts

## Core Concept

UPNOTE-style note functionality should be developed as a separate feature module.

The existing memo/notebook features are kept as reference implementations until the new UPNOTE feature is stable.

## Initial User State Model

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

## Current Git State

- Local commit: `b0cae2e Prepare note00 gallery note db`
- Remote: `origin/main`
- Upstream reference: `upstream-nacc`

## Non-goals For First Pass

- Do not fully rewrite every DB screen at once
- Do not delete old memo/notebook code yet
- Do not connect a new backend until the local model is clear
- Do not optimize visual design before the data model is usable
