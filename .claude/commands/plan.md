# Plan Feature Implementation

Feature to plan: $ARGUMENTS

## Pre-Planning Check

1. **Has exploration been done?**
   - If not, ask: "Should I first run `/explore` to understand the codebase better?"

2. **Read SCRATCHPAD.md** for context on:
   - Related past decisions
   - Known issues that might affect this
   - Current focus areas

## Planning Process

### 1. Define Success

Answer these clearly:
- **What does "done" look like?** (observable behavior)
- **What's the minimal viable version?** (cut scope ruthlessly)
- **How will we test it works?** (build command, manual check)

### 2. Break Down Tasks

Create a numbered task list with these rules:
- Each task should be completable in one focused session
- Tasks should be ordered by dependency (do A before B)
- Mark tasks that modify large files (HomeView.swift, SupabaseService.swift)
- Include verification step for each task

Format:
```
1. [ ] Task description
   - Files: [files to modify]
   - Depends on: [task numbers, or "none"]
   - Verify: [how to confirm it works]
```

### 3. Identify Risks

- What could break existing functionality?
- What needs manual testing in the simulator?
- Are there edge cases to handle?

### 4. Output the Plan

Write the plan to a markdown file:

**File path**: `plans/[feature-name]-plan.md`

**Template**:
```markdown
# Plan: [Feature Name]

Created: [date]
Status: Not Started

## Goal
[One sentence]

## Success Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Tasks

### Phase 1: [Name]
- [ ] 1. [Task]
      - Files: [list]
      - Verify: [how]
- [ ] 2. [Task]
      - Files: [list]
      - Verify: [how]

### Phase 2: [Name]
- [ ] 3. [Task]
      - Files: [list]
      - Verify: [how]

## Risks
- [Risk and mitigation]

## Notes
[Any context for future sessions]
```

### 5. Update SCRATCHPAD.md

Add entry to "In Progress" section with link to plan file.

### 6. Get Approval

Present the plan summary and ask:
"Does this plan look right? Should I start with task 1?"

---

**Important**: Do NOT start implementing until the user approves the plan.
