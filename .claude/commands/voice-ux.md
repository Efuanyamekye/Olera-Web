# Voice Assistant UX Review

Analyze a voice assistant transcript to identify UX issues and suggest improvements.

Input: $ARGUMENTS (paste transcript directly, or provide file path)

## Analysis Framework

### 1. Parsing Failures (Critical)
Look for patterns where the assistant didn't understand valid user input:
- User says something reasonable but assistant repeats same question
- Common phrases not recognized (e.g., "above 1500", "more than", "around")
- Numbers spoken as words not parsed correctly
- Location/city names not recognized

**For each failure, identify:**
- What the user said
- What should have been parsed
- Which parser function needs updating (`VoiceIntentParser.swift` or `VoiceAssistantView.swift`)

### 2. Conversation Flow Issues
- **Loops**: Same question asked 3+ times in a row
- **Duplicates**: Same message recorded twice consecutively
- **Missing confirmations**: User provides info but no acknowledgment
- **Abrupt transitions**: Jumping to next question without confirming understanding
- **Lost context**: Forgetting information user already provided

### 3. Language & Tone
- **Robotic phrasing**: Overly formal or unnatural language
- **Missing empathy**: Not acknowledging user frustration
- **No language mirroring**: Not using user's terminology (e.g., "my mom" -> "your mom")
- **Inconsistent subject reference**: Switching between "you" and the care recipient

### 4. Missing Data
Check "Collected Information" section at top of transcript:
- Any fields showing "N/A" that should have been captured?
- Did conversation end before all fields were collected?
- Were there opportunities to extract data that were missed?

### 5. Keyword Gaps
Identify words/phrases the user used that should be recognized:
- Care-related terms not in keyword lists
- Income descriptions not parsed
- Location variations not handled
- Relationship terms not detected

## Output Format

### Summary
Brief overview of the conversation quality (1-2 sentences)

### Critical Issues (Fix Immediately)
Issues that caused user frustration or blocked progress

### Improvements (High Value)
Changes that would significantly improve the experience

### Nice-to-Have
Minor polish items

### Code Changes Required
For each issue, provide:
```
File: path/to/file.swift
Function: functionName
Change: Add "keyword" to the parsing list
```

## Key Files Reference
- `OleraClean/VoiceIntentParser.swift` - Main parsing logic, keyword lists
- `Views/SBF/VoiceAssistantView.swift` - ViewModel with `extractX()` functions
- `OleraClean/SpeechRecognitionManager.swift` - Speech-to-text handling
- `Models/BenefitsModels.swift` - Enums for parsed values

## Common Fixes
1. **Add keyword**: Find the relevant keyword array and add the missing term
2. **Fix income parsing**: Check `parseIncome()` and `extractIncomeRange()` for missing patterns
3. **Add personal care term**: Update `personalCareKeywords` array
4. **Prevent duplicates**: Check `lastProcessedTranscript` logic
5. **Add failure fallback**: Increase `maxConsecutiveFailures` threshold or improve error message
