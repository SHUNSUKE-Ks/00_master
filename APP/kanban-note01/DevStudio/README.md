# DevStudio: note00-gallerynotedb_vol1.1

## Purpose

NACC System cloneを、Gallery / DB / Relationを備えた汎用ノートアプリへ再構成するための開発管理フォルダ。

このDevStudioは、Codex相談時にローカルファイルを見ながら開発状況、資料、TODO、DONE定義を確認しやすくすることを目的にする。

## Project

- Project: note00-gallerynotedb_vol1.1
- App path: C:/Users/enjoy/InBox2026/InBox0601/06_AppList/note00-gallerynotedb_vol1.1
- GitHub: https://github.com/SHUNSUKE-Ks/note00-gallerynotedb_vol1.1
- Base clone: https://github.com/SHUNSUKE-Ks/nacc_system
- Framework: SolidJS + Vite + PWA

## Current Status

- Clone: done
- Initial Git push: done
- NACC sample data removal: done
- Project/PWA rename: done
- UPNOTE feature boundary: started
- Build: pass

## DevStudio Files

- `00_Project_Brief.md`: project intent and scope
- `01_Architecture_Notes.md`: current architecture and reuse boundaries
- `02_Development_Plan.md`: phased development plan
- `03_Kanban.md`: text-only task board
- `04_Reference_Index.md`: local files and useful references
- `05_Done_Definition.md`: DONE and release criteria
- `06_Questions.md`: open questions and decisions

## Important Policy

Do not delete old memo/notebook code yet.

UPNOTE-specific note features should be created under:

```txt
src/features/upnote
```

Old memo/tag/notebook features can be used as reference, but should not become the final reusable feature boundary.
