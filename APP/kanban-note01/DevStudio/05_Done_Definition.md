# 05 DONE Definition

## MVP DONE

- App opens as note00, not NACC
- No NACC sample records are visible
- User can create a note
- User can edit title and body
- User can add tags
- User can filter by tags
- User can see notes in list/gallery form
- User can see notes in DB/table form
- User can link one note to another
- State shows active surface and editor mode
- Build passes

## Engineering DONE

- UPNOTE code is separated under `src/features/upnote`
- Components do not directly depend on NACC product/nutrient names
- Persistence is accessed through a repository/adapter boundary
- Old memo/notebook code remains available as reference until replacement is stable
- All new files use TypeScript types

## UX DONE

- Current active area is understandable
- Writing state is distinct from browsing state
- Side panel state is explicit
- Empty states are clear
- Mobile layout is not broken

## Report DONE

- Progress is reported back to BrainNote
- Reusable components are noted for Component Bank
- Errors are logged as md reports when useful
