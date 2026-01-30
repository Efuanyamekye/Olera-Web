# UI/UX Critique

Analyze a screenshot and suggest visual/UX improvements.

Screenshot: $ARGUMENTS

## Design Philosophy

Olera's visual identity should capture:
- **Airbnb**: Clean, spacious, trustworthy, photography-forward
- **Claude**: Warm, calm, sophisticated, thoughtful use of whitespace
- **Modern simplicity**: Nothing unnecessary, every element earns its place
- **Elegant restraint**: Premium feel without being flashy or corporate

The goal is an interface that feels calm and reassuring (important for senior care) while being modern and trustworthy. Think "boutique hotel" not "hospital" or "insurance company".

Note: The screenshot is for content/layout reference - focus suggestions on styling and visual treatment.

## Analysis Framework

### 1. First Impressions (3-second test)
- What draws the eye first?
- Is the hierarchy clear?
- Does it feel cluttered or balanced?

### 2. Visual Design
- **Spacing**: Is there consistent padding/margins? Does it feel cramped or too sparse?
- **Typography**: Is the hierarchy clear? Are text sizes appropriate?
- **Colors**: Good contrast? Consistent with Olera's palette (teal accent, warm backgrounds)?
- **Alignment**: Are elements properly aligned? Any visual tension?

### 3. iOS/SwiftUI Patterns
- Does it follow iOS Human Interface Guidelines?
- Are touch targets at least 44pt?
- Does it use native patterns users expect (sheets, navigation, lists)?

### 4. Olera-Specific
- Matches the "calm, premium, Airbnb-simple" aesthetic?
- Uses serif (New York) for hero text, SF Pro for UI?
- Appropriate use of cards/surfaces?

### 5. Accessibility
- Sufficient color contrast?
- Would it work in Dark Mode?
- Text readable at default sizes?

## Output Format

Provide:
1. **What's Working** - Don't just criticize, note what's good
2. **Suggested Improvements** - Prioritized list with specific, actionable changes
3. **Quick Wins** - Small changes with big impact
4. **Optional Enhancements** - Nice-to-haves if time permits

Be specific. Instead of "improve spacing", say "Add 16pt padding between the cards".

Ask the user for their thoughts too - they mentioned having ideas.
