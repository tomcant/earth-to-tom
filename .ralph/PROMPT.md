You are working through a specification to build a software project from scratch
Path: {SPEC_PATH}

## Tracking Progress
Path: {PROGRESS_PATH}
This file tracks completed spec items. Format: ["id1", "id2", ...]
An item is only complete if it appears in this file

## Making Notes
Path: {MEMORY_PATH}
This file contains useful notes left by previous iterations

## Instructions
1. Read the spec and check the progress tracker to see which items are already complete
2. If all items are complete, create a file at {COMPLETE_MARKER} and stop
3. Pick the next most logical item, make a plan and begin implementation
4. Update the progress tracker to mark the item as complete
5. Update the notes with anything the next iteration needs to know:
   - Decisions you made (file structure, naming, patterns)
   - Gotchas or constraints discovered during implementation
   - Do NOT repeat the spec content, just add contextual notes
6. Commit all files with an appropriate message
     e.g. "feat: persistent state tracking"

IMPORTANT:
- Implement ONE item only
- Do not ask questions, make reasonable decisions and proceed
- Do not modify the spec or any file in {RALPH_DIR}, they are read-only
- Do not skip updating the progress tracker, the next iteration depends on it
