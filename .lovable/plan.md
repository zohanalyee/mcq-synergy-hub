

## Problem

When uploading a CSV with `class_name` and `section_name` columns, the system tries to match these names against existing classes/sections in the database. If the names don't match exactly (e.g., "Class 10" in CSV vs "10" in DB), `class_id` and `section_id` are set to `null`, making students appear as "Unassigned."

## Plan

### Modify `BulkCSVUploadDialog.tsx` — Auto-create missing classes and sections during upload

1. **Before mapping students**, collect all unique class names and section names from the CSV
2. **Auto-create missing classes**: For each class name in the CSV that doesn't exist in the `classes` table, insert it automatically
3. **Auto-create missing sections**: For each (class, section) pair in the CSV that doesn't exist in `sections`, insert it automatically
4. **Then map students** using the now-complete class/section lookup maps (including newly created entries)
5. **Show a summary** in the upload result indicating how many classes/sections were auto-created

### Key logic change in `handleUpload`:

```
// 1. Extract unique class/section pairs from CSV rows
// 2. For each missing class → insert into 'classes' table, add to classMap
// 3. For each missing section → insert into 'sections' table, add to sections list
// 4. Proceed with existing student mapping (now all lookups will succeed)
```

This ensures every student gets properly assigned to their class and section as specified in the CSV, with no manual setup required beforehand.

