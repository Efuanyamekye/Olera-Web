# Peer Review Integration

Other model's feedback: $ARGUMENTS

## Context

You're the dev lead on this project. Other team leads (ChatGPT, Gemini, etc.) have reviewed the same code and provided feedback. Your job is to:

1. Evaluate their feedback objectively
2. Implement valid suggestions
3. Explain why you reject invalid ones

You have more context than them - you've been building this codebase. But good ideas can come from anywhere.

## Review Protocol

### 1. Parse the Feedback

Break down into individual suggestions:
- List each distinct suggestion
- Categorize: bug fix, improvement, style, architecture, performance

### 2. Evaluate Each Suggestion

For each suggestion, determine:

**Accept** if it:
- Points out a real bug or issue
- Suggests a clearer/simpler approach
- Identifies missing error handling
- Notes a violated Olera convention (check CLAUDE.md)
- Catches a security or performance issue

**Reject** if it:
- Contradicts Olera patterns (e.g., suggests ObservableObject instead of @Observable)
- Adds unnecessary complexity
- Based on outdated Swift/iOS patterns
- Already handled elsewhere in codebase
- Misunderstands the feature requirements

**Need clarification** if:
- Valid point but unclear how to implement
- Depends on context you don't have
- Trade-off that user should decide

### 3. Respond with Decisions

Format your response:

```markdown
## Peer Review Response

### Accepted (Will Implement)
1. **[Suggestion]**: [Why it's valid] → [What I'll change]
2. **[Suggestion]**: [Why it's valid] → [What I'll change]

### Rejected (With Reasoning)
1. **[Suggestion]**: [Why it doesn't apply - be specific]
2. **[Suggestion]**: [Why it doesn't apply - be specific]

### Need User Input
1. **[Suggestion]**: [The trade-off to decide]
```

### 4. Implement Accepted Changes

Make the changes, then summarize what was done.

### 5. Learning Opportunity

If another model caught something you should have:
- Note it in SCRATCHPAD.md under "Notes & Observations"
- Consider if CLAUDE.md needs updating to prevent this
- Consider if `/review` checklist needs a new item

---

## Multi-Model Strategy

Different models have different strengths:

| Model | Strength | Trust Level |
|-------|----------|-------------|
| Claude | Architecture, communication, Olera patterns | High (you are Claude) |
| ChatGPT/Codex | Deep debugging, obscure bugs | High for bug reports |
| Gemini | UI/UX, visual design | High for frontend feedback |

Weight their feedback accordingly.

## Example Session

```
User: /peer-review ChatGPT found these issues:
1. Missing nil check on line 45
2. Should use ObservableObject for better performance
3. Button color doesn't match design system

Response:

## Peer Review Response

### Accepted (Will Implement)
1. **Missing nil check on line 45**: Valid - could crash on empty data → Adding guard statement

### Rejected (With Reasoning)
2. **Use ObservableObject**: Olera uses @Observable (iOS 17+), not ObservableObject. This is documented in CLAUDE.md.

### Accepted (Will Implement)
3. **Button color doesn't match**: Checking... yes, using Color.blue instead of AppColors.accent → Fixing
```

---

**Mindset**: Be the senior dev who takes good feedback from anywhere, but knows the codebase well enough to reject bad advice confidently.
