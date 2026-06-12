# 02 Development Plan

## Phase 0: Preparation

Status: done

- Clone NACC System
- Rename project and PWA metadata
- Remove NACC sample data
- Add UPNOTE feature boundary
- Build successfully
- Push initial repo

## Phase 1: Note Model

Goal: define a note model that can drive editor, gallery, DB, and relation.

Tasks:

- Add `UpnoteNote` sample data
- Add local note repository
- Add note CRUD actions
- Add tag filter actions
- Add relation IDs to notes

DONE:

- Notes can be created, selected, edited, tagged, and linked locally
- UI state changes when editor/list/panel becomes active

## Phase 2: Editor Surface

Goal: create the first UPNOTE-specific editor that does not depend on old memo code.

Tasks:

- Create `UpnoteEditor.tsx`
- Add title/body/tag editing
- Track `editorMode`
- Track `isDirty`
- Add save/cancel flow

DONE:

- Editor can edit one active note
- State shows writing/idle mode
- Dirty state is visible in app state

## Phase 3: Gallery And DB Connection

Goal: make notes visible through gallery/card and table views.

Tasks:

- Create note gallery card view
- Create note database table view
- Reuse Gallery layout patterns where useful
- Rename visible DB labels from product language to note language

DONE:

- Same note data appears in editor, gallery, and database views
- Tags filter notes consistently

## Phase 4: Relation View

Goal: browse note-to-note links.

Tasks:

- Add relation panel
- Add relation focus state
- Add linked notes list
- Add relation add/remove actions

DONE:

- Active note can show linked notes
- Relation focus can change independently from editor focus

## Phase 5: PWA Polish

Goal: make the app recognizable and installable as note00.

Tasks:

- Replace PWA icons
- Update favicon
- Update app theme colors
- Verify install metadata

DONE:

- Manifest shows note00
- Installed app icon is not NACC
- Build passes

## Phase 6: Report Back To BrainNote

Goal: submit implementation progress back to BrainNote.

Tasks:

- Add report markdown
- Add known reusable components
- Add error reports when needed
- Add next TODO

DONE:

- BrainNote ReportBox can track progress
