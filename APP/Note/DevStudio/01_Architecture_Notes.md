# 01 Architecture Notes

## Current App Structure

```txt
src
├─ components
├─ db
├─ features
│  └─ upnote
├─ pages
│  └─ gallery
├─ store
└─ types
```

## Reuse Candidates From NACC

Keep and adapt:

- Gallery grid/detail/tag sheet
- DB table/detail/index patterns
- Side panel layout
- Tag picker behavior
- Memo editor interaction ideas
- Notebook page list/editor split

Remove or rename:

- product-specific labels
- nutrient-specific labels
- cosmetic/supplement sample data
- NACC branding
- product/nutrient Firebase collection names, once adapter work begins

## UPNOTE Feature Boundary

Current boundary:

```txt
src/features/upnote
├─ index.ts
├─ state.ts
└─ types.ts
```

Planned additions:

```txt
src/features/upnote
├─ components
│  ├─ UpnoteEditor.tsx
│  ├─ UpnoteList.tsx
│  ├─ UpnoteSidePanel.tsx
│  └─ UpnoteRelationPanel.tsx
├─ data
│  └─ sampleNotes.ts
├─ persistence
│  ├─ localNoteAdapter.ts
│  └─ noteRepository.ts
└─ shortcuts
   └─ shortcutMap.ts
```

## State Responsibilities

`upnoteUiState` should answer:

- Where is the user acting now?
- Which note is active?
- Is the user writing, previewing, or selecting?
- Which side panel is active?
- Which relation node is focused?
- Are there unsaved changes?

## Persistence Direction

Short term:

- local sample data
- localStorage or IndexedDB adapter

Middle term:

- keep Firebase behind an adapter if needed
- do not let components call backend directly

Target:

```txt
Component -> feature action -> repository -> adapter
```
