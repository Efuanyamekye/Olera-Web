# Explore Before Building

Feature or area to explore: $ARGUMENTS

## Exploration Protocol

Before planning or writing ANY code, deeply understand the existing codebase.

### Step 1: Ask Clarifying Questions

**STOP and ask the user these questions before proceeding:**

1. **User perspective**: Who is this for - care seeker, provider, or both?
2. **Existing behavior**: Is there something similar that should work differently, or is this net-new?
3. **Priority**: Is this a quick fix, MVP feature, or polish pass?
4. **Constraints**: Any technical constraints I should know about? (e.g., "don't touch SupabaseService")

Wait for answers before continuing.

### Step 2: Map the Territory

Search the codebase to understand:

1. **Similar features**: What existing code does something similar?
   - Search for related keywords in Views/, ViewModels/, Models/
   - Read at least 2-3 similar files completely

2. **Data flow**: Where does the data come from and go?
   - Check SupabaseService.swift for relevant tables/functions
   - Check AppViewModel.swift for related state

3. **UI patterns**: What components exist that we might reuse?
   - Browse Views/Components/ for relevant pieces
   - Check the design system usage in similar views

4. **Dependencies**: What would this change touch?
   - Which files import/use the area being changed?
   - Are there navigation flows that depend on this?

### Step 3: Document Findings

Create an exploration summary:

```
## Exploration Summary: [Feature Name]

### Similar Existing Code
- [File 1]: [What it does, what we can learn]
- [File 2]: [What it does, what we can learn]

### Relevant Data
- Tables: [list]
- ViewModels: [list]
- Key functions: [list]

### Reusable Components
- [Component]: [How it could help]

### Risks & Considerations
- [Risk 1]
- [Risk 2]

### Recommended Approach
[1-2 sentences on how to proceed]
```

### Step 4: Hand Off

After exploration, ask: "Should I now create a detailed implementation plan with `/plan`?"

---

**Remember**: The goal is understanding, not implementation. Do NOT write code during exploration.
