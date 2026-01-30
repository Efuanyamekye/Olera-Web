# Code Review for Olera

Target: $ARGUMENTS (file path, "recent" for uncommitted changes, or "export" to generate for external review)

## Review Mode Selection

- **Standard** (default): Review code and provide feedback directly
- **Export** (when argument includes "export"): Generate a document for external AI review

---

## Standard Review Checklist

### SwiftUI Best Practices
- [ ] Using `@Observable` not `ObservableObject`
- [ ] `@MainActor` on ViewModels that update UI
- [ ] Using `.task {}` instead of `.onAppear` for async
- [ ] No force unwraps unless justified
- [ ] Proper error handling with do/catch

### Olera Design System
- [ ] Colors use `AppColors.*` (no raw hex values)
- [ ] Typography uses `TextStyle` via `.style()` modifier
- [ ] Follows naming conventions (*View, *Sheet, etc.)

### Architecture
- [ ] Data fetching through `SupabaseService` (not new services)
- [ ] Reusable components in `/Views/Components/`
- [ ] Local fallbacks for offline scenarios
- [ ] State in appropriate ViewModel

### Performance
- [ ] No unnecessary re-renders (check state placement)
- [ ] Large lists use `LazyVStack` or `List`
- [ ] Images properly sized/cached
- [ ] No blocking main thread

### Common Issues to Flag
- Hardcoded strings that should be localized
- Missing accessibility labels
- Potential retain cycles in closures (`[weak self]`)
- API keys or secrets in code
- Debug print statements left in

### Output Format

Provide specific, actionable feedback with file:line references:
```
## Review: [filename]

### Issues Found
1. **[Severity]** Line [X]: [Issue description]
   - Fix: [How to fix]

2. **[Severity]** Line [X]: [Issue description]
   - Fix: [How to fix]

### Suggestions
- [Optional improvement]

### Verdict
[Pass / Pass with notes / Needs changes]
```

---

## Export Mode (for external AI review)

When argument includes "export", create a review document for another AI to review.

### Export Process

1. Read the target file(s)
2. Create document at `reviews/[filename]-review-[date].md`
3. Use this template:

```markdown
# Code Review Request

**File**: [path]
**Date**: [date]
**Lines**: [count]
**Reviewer**: [Which AI will review - ChatGPT, Gemini, etc.]

## Code Summary
[2-3 sentences about what this code does in the Olera app]

## Full Code
\`\`\`swift
[full code content]
\`\`\`

## Context for Reviewer
- Olera is an iOS 17+ SwiftUI app for senior care marketplace
- Uses `@Observable` macro (NOT ObservableObject)
- All colors must use `AppColors.*` (no raw hex)
- All typography must use `.style()` modifier with TextStyle enum
- Backend is Supabase (PostgreSQL)
- Large files to be careful with: HomeView.swift, SupabaseService.swift

## Initial Assessment
[Your findings from the checklist above]

## Specific Questions
1. [Area where you want second opinion]
2. [Specific concern or uncertainty]

## How to Return Feedback
Copy reviewer's feedback and run: `/peer-review [paste feedback]`
```

4. Tell user: "Review exported to `reviews/[filename]-review-[date].md`. Paste this into ChatGPT/Gemini and bring back their feedback with `/peer-review`"

---

## Quick Reference

| Command | Action |
|---------|--------|
| `/review HomeView.swift` | Review specific file |
| `/review recent` | Review uncommitted changes |
| `/review recent export` | Export uncommitted changes for external review |
| `/review Views/` | Review all files in directory |
