# Quick Save - End of Session Workflow

Quickly save progress, commit, and create/update a PR. Use this at the end of a session.

## Steps

### 1. Save Progress to SCRATCHPAD.md

Review what was accomplished in this session and update SCRATCHPAD.md:
- Add entry to "Session Log" with today's date and summary
- Update "Current Focus" if it changed
- Update "In Progress" with current work state
- Add any new "Decisions Made" with rationale
- Update "Next Up" with what should be done next

Keep entries concise - include file paths modified and the WHY behind decisions.

### 2. Check Branch Status

Check if we're on a feature branch:
- If on `main`, ask user: "Create a new branch for these changes? (e.g., `feature/description`)"
- If on a feature branch, continue

### 3. Commit Changes

Check git status and create a well-formed commit:
- Stage all relevant changed files
- Write commit message in imperative mood ("Fix X" not "Fixed X")
- First line: short summary (50 chars max)
- Body: explain WHAT and WHY

### 4. Push and Create/Update PR

After committing:
1. Push the current branch to remote: `git push origin <branch-name>`
2. Check if a PR already exists: `gh pr view`
3. If no PR exists, create one:
   ```bash
   gh pr create --title "<title>" --body "<description>"
   ```
4. If PR exists, just confirm it's updated (push automatically updates the PR)

### 5. Report Status

Show the user:
- Branch name
- Commit(s) pushed
- PR URL (clickable link)
- PR status (draft, ready for review, etc.)

## Important Notes

- **Never merge directly to main** - always use PRs
- If there are uncommitted changes that shouldn't be committed, STOP and ask
- If on main with changes, always create a branch first
- Show the PR URL so user can review/merge in GitHub

## PR Title/Body Guidelines

**Title**: Short, descriptive (e.g., "Add search functionality")

**Body template**:
```
## Summary
- [What changed]

## Test plan
- [How to verify]
```

Now execute these steps in order.
