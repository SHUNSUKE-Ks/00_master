# 06 Questions

## Open Questions

1. Should the visible app name be `note00`, `GalleryNoteDB`, or `note00 Gallery Note DB`?
2. Should Firebase be used in the first usable prototype, or should local-only persistence come first?
3. Should old Memo/Notebook routes remain visible during development?
4. Should DB01/DB02/DB03/DB10 remain as labels internally, or be renamed in route names too?
5. Should PWA icon be generated as a bitmap first, or designed as SVG/PNG by code?

## Current Assumptions

- Keep old note features for reference
- Build new UPNOTE feature separately
- Prioritize local state and local data model before backend
- Keep Gallery/DB/Relation structure
- Remove NACC content but not useful layout patterns

## Recommendation

Use this DevStudio folder, but rename the Dropbox DevStudio folder later from:

```txt
DS_SolidJS_NovelEngine_OneJson
```

to:

```txt
DS_note00_gallerynotedb_vol1_1
```

The current folder can work technically, but the name no longer describes the project and may confuse future Codex sessions.
