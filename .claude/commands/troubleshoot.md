# Troubleshoot Issue

Problem: $ARGUMENTS

## Rules of Engagement

**This is important. Take your time and dig deep.**

1. **Do NOT come back until this is fixed AND verified**
2. **This may be a repeat attempt** - the obvious fix likely didn't work. Look deeper.
3. **Assume the simple solution was already tried and failed**

## Troubleshooting Protocol

### Phase 1: Layer Analysis (CRITICAL - Do This First)

Before writing ANY code, determine which layer is actually broken:

**For Voice Assistant / NLU issues:**
| Layer | What it does | How to verify |
|-------|--------------|---------------|
| Speech Recognition | Converts voice to text | Check transcript - is the text correct? |
| LLM Extraction | Extracts structured data from text | Check logs for extracted values (city, age, etc.) |
| Keyword Fallback | Regex/pattern matching backup | Check if patterns exist for this input |
| Data Lookup | Converts extracted data to actionable values (e.g., city → ZIP) | Check if lookup function receives correct input |
| State Application | Applies extracted data to ViewModel | Check if state is being set |

**Ask yourself:**
- "What logging exists to verify each layer?"
- "If I add a print statement, where should it go?"
- "Is the problem that data isn't extracted, or that extracted data isn't used?"

**Common trap:** Fixing the wrong layer because you assumed where the bug was.

### Phase 2: Understand the Full Picture
- Don't just grep for the obvious. Read the actual files involved.
- Trace the data/UI flow end-to-end
- Check if there are multiple components that could be responsible
- Look for overrides, parent constraints, or conflicting styles
- **Add logging if it doesn't exist** - you can't fix what you can't see

### Phase 3: Identify the Real Cause
- The symptom location may not be the cause location
- Check for:
  - Parent view constraints overriding child settings
  - Multiple components with similar names (e.g., ProviderCard vs ProviderTile)
  - Cached/stale builds masking changes
  - SwiftUI layout priority conflicts
  - Conditional rendering using different components
  - **Missing functionality** (feature not implemented, not just broken)
  - **Fallback paths not triggered** (condition prevents fallback from running)
  - **Silent failures** (no logging = no visibility into what's happening)

### Phase 4: Implement the Fix
- Fix ALL instances, not just the first one found
- Consider if similar issues exist elsewhere
- **If adding to a multi-path system (LLM + fallback), fix BOTH paths**
- Add logging if it was missing - future debugging depends on it

### Phase 5: Verify (REQUIRED)
- Build the project: `xcodebuild -scheme OleraClean -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build`
- If possible, describe what visual change should be observable
- If the fix involves multiple files, list all files changed
- **If logging was added, explain what logs to look for**

### Phase 6: Report Back
Only after verification, provide:
1. **Root cause**: What was actually causing the issue
2. **Why previous attempts may have failed**: What was missed
3. **What was changed**: Specific files and changes
4. **How to verify**: What the user should see differently
5. **Logging added**: What new logging can be checked in future

---

## Case Study: City Recognition Bug (Jan 2026)

**8 failed fixes** because they all targeted the wrong layer.

| Attempt | What was tried | Why it failed |
|---------|----------------|---------------|
| 1-5 | Added keywords to VoiceIntentParser | LLM extraction was being used, not keyword parser |
| 6-7 | Fixed city lookup logic | City was never extracted to begin with |
| 8 ✅ | Added logging, found LLM wasn't extracting city, fixed LLM prompt AND added keyword fallback | Fixed the actual broken layer |

**Lesson**: Always verify which layer is broken before fixing. Logging is your friend.

---

Now investigate thoroughly. Don't rush.
