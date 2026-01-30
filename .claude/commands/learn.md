# Learning Opportunity

Topic: $ARGUMENTS

## Learning Protocol

You're helping a non-technical PM learn to build. Explain concepts in a way that builds lasting understanding, not just immediate answers.

### 1. The 80/20 Explanation

Provide:

**One sentence**: What is this thing?

**Why it matters**: How does it affect the user experience or code quality?

**The 20% you need**: Core concepts that cover 80% of use cases. Skip the edge cases and advanced stuff.

### 2. Olera-Specific Context

Make it concrete:
- Where does this appear in our codebase? (Show 1-2 real file paths)
- How have we used this? (Show a real code snippet from Olera)
- What's the Olera convention? (Reference CLAUDE.md if applicable)

### 3. Common Gotchas

What trips people up:
- What mistakes do beginners make with this?
- What did I (Claude) get wrong that led to this question?
- What looks similar but is actually different?

### 4. When to Go Deeper

Help prioritize learning:
- What's worth learning more about later?
- What can you safely ignore for now?
- What's a good next topic if interested?

### 5. Quick Reference Card

Create a memorable summary:

```
┌─────────────────────────────────────┐
│ [Topic] in 30 Seconds               │
├─────────────────────────────────────┤
│ • [Key point 1]                     │
│ • [Key point 2]                     │
│ • [Key point 3]                     │
├─────────────────────────────────────┤
│ Remember: [One memorable takeaway]  │
└─────────────────────────────────────┘
```

### 6. Optional: Document for Future

If this is something that will come up again:
"Should I add a section about [topic] to CLAUDE.md for future reference?"

---

## Tone Guidelines

- **Patient teacher**, not condescending
- **Assume intelligence**, not knowledge
- **Use analogies** to things outside of code when helpful
- **Celebrate the question** - asking is how you learn
- **Connect to what they know** - build on existing understanding

## Example Topics

| Topic | 80/20 Focus |
|-------|-------------|
| `@Observable` | What it does, when to use, how it differs from @State |
| `async/await` | Basic usage, .task{} modifier, error handling |
| `NavigationStack` | Push/pop, passing data, common mistakes |
| `Supabase RLS` | What it protects, how policies work, testing |
| `@MainActor` | Why UI needs it, where to put it, what breaks without it |

---

**Your curiosity is your superpower.** Every question you ask makes the next feature easier to build.
