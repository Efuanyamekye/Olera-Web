# Quick Save - End of Session Workflow

Quickly save progress, commit, and merge to main. Use this at the end of a session.

## Steps

### 1. Save Progress to SCRATCHPAD.md

Review what was accomplished in this session and update SCRATCHPAD.md:
- Add entry to "Session Log" with today's date and summary
- Update "Current Focus" if it changed
- Update "In Progress" with current work state
- Add any new "Decisions Made" with rationale
- Update "Next Up" with what should be done next

Keep entries concise - include file paths modified and the WHY behind decisions.

### 2. Commit Changes

Check git status and create a well-formed commit:
- Stage all relevant changed files
- Write commit message in imperative mood ("Fix X" not "Fixed X")
- First line: short summary (50 chars max)
- Body: explain WHAT and WHY

### 3. Merge to Main

After committing to the current branch:
1. Push the current branch to remote
2. Switch to main branch
3. Pull latest main
4. Merge the feature branch into main
5. Push main to remote
6. Switch back to the feature branch (for continued work if needed)

## Important Notes

- If there are merge conflicts, STOP and ask the user how to proceed
- If there are uncommitted changes that shouldn't be committed, STOP and ask
- Show the user what's happening at each step
- At the end, confirm: branch merged, main pushed, current branch status

Now execute these steps in order.
