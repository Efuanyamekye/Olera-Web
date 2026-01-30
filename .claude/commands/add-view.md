# Add New SwiftUI View

Create a new SwiftUI view for Olera following project conventions.

## Requirements
- View name: $ARGUMENTS

## Instructions

1. Create the view file in the appropriate location:
   - Reusable components → `/Views/Components/`
   - Provider-specific → `/Views/ProviderMode/`
   - General views → `/Views/`

2. Follow these patterns:
   - Use `AppColors` for all colors (never raw hex)
   - Use `TextStyle` enum via `.style()` modifier for typography
   - Use `@Observable` if state management needed
   - Add `@MainActor` if the view updates UI from async code

3. Template structure:
```swift
import SwiftUI

struct [ViewName]: View {
    // MARK: - Properties

    // MARK: - Body
    var body: some View {
        // Implementation
    }
}

// MARK: - Subviews

// MARK: - Preview
#Preview {
    [ViewName]()
}
```

4. If the view needs app state, inject via Environment:
```swift
@Environment(AppViewModel.self) private var viewModel
```

Create the view now following these conventions.
