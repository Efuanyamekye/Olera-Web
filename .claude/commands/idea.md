# Quick Idea Capture

Idea: $ARGUMENTS

## Capture Protocol

This is for FAST capture. Do not elaborate, investigate, or plan.

### 1. Categorize & Prioritize

Determine the type and priority:

**Type** (for the title prefix):
- `[Bug]` - Something broken
- `[Feature]` - New capability
- `[Improvement]` - Better version of existing thing
- `[Debt]` - Technical cleanup needed

**Priority**:
- `P1 🔥` - Blocking or critical
- `P2` - Should do soon
- `P3` - Normal priority
- `Backlog` - Nice to have, do when time permits

### 2. Create Notion Page in iOS App Roadmap

Use the Notion MCP to create a page in the iOS App Action Items database.

**Database**: `collection://2eb5903a-0ffe-81ab-a3b5-000b48ad7ece`

**Properties to set**:
```
Name: "[Type] Brief description"
Status: "To Do"
Priority: [determined above]
```

**Page content** (brief):
```markdown
## Context
[1-2 sentences about where you were when this came up]

## Captured from
Claude Code session - [date]
```

### 3. Example

If user says: `/idea the provider card button color is wrong`

Create:
```
Name: "[Bug] Provider card button using wrong color"
Status: "To Do"
Priority: "P3"

Content:
## Context
Noticed during development that CTA button on provider cards is using raw blue instead of AppColors.accent.

## Captured from
Claude Code session - Jan 20, 2026
```

### 4. Confirm & Return

Say: "Added to iOS App Roadmap in Notion: [title]. Priority: [priority]. Back to what we were doing?"

---

## Speed is the point

This should take under 30 seconds.

If the idea needs more thought, capture it now with `Backlog` priority and revisit with `/plan` later.

## Fallback

If Notion MCP fails, append to local `IDEAS.md` file instead and note that Notion was unavailable.
