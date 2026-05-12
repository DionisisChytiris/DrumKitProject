# Keyboard Key Binding Customization

## Overview

You can now customize which keyboard keys trigger each drum in your kit! This feature is fully integrated with Redux and localStorage, so your custom key bindings are saved automatically.

## How to Use

1. **Open the Customize Modal**: Click the "Customize" button in the navigation bar
2. **Select a Drum**: Click on any drum in the customization panel
3. **Edit Key Binding**: 
   - Click the "✏️ Edit" button next to the current key binding
   - Press any letter key or Space bar
   - Press Enter to confirm, or Escape to cancel
   - The key binding updates immediately!

## Features

### ✅ Validation
- **Duplicate Prevention**: The system prevents assigning the same key to multiple drums
- **Single Character Only**: Only single letters (A-Z) or "Space" are allowed
- **Real-time Updates**: Changes take effect immediately in the Practice page

### ✅ Special Keys
- **Space Bar**: Type "Space" or press the spacebar to assign it
- **Case Insensitive**: Key bindings work regardless of Caps Lock

### ✅ Visual Feedback
- Current key binding is displayed in the drum selector button
- Key binding is shown in a styled `<kbd>` element
- Edit button appears when a drum is selected

### ✅ Reset to Defaults
- The "🔄 Reset to Default Drum Kit" button resets both:
  - Audio samples (to default sounds)
  - Key bindings (to default keys from `drumConfig.ts`)

## Default Key Bindings

The default key bindings are set in `src/utils/drumConfig.ts`:

- **Kick**: `Space`
- **Snare**: `S`
- **Hi-Hat**: `H`
- **Crash**: `C`
- **Crash 2**: `V`
- **High Tom**: `T`
- **Mid Tom**: `M`
- **Floor Tom**: `F`
- **Ride**: `R`
- **Low Floor Tom**: `L`
- **China**: `X`

## Technical Details

### Storage
- Key bindings are stored in Redux state
- Automatically persisted to localStorage
- Loaded on app startup

### Keyboard Handler
- Located in `src/screens/Practice.tsx`
- Only active when in fullscreen mode
- Handles both regular keys and "Space" specially
- Case-insensitive matching

### Redux Integration
- Uses `updateDrumPiece` action to update key bindings
- Part of the `DrumPiece` interface in `src/types/index.ts`
- Stored in `drumKit` array in Redux state

## Example Usage

1. Open Customize modal
2. Click on "Kick Drum"
3. Click "✏️ Edit" next to "Key: Space"
4. Press "K" key
5. Press Enter
6. Now the Kick drum is triggered by "K" instead of "Space"
7. Changes are saved automatically!

## Troubleshooting

**Q: I can't assign a key that's already used**
- A: The system prevents duplicate key bindings. You'll see an alert showing which drum already uses that key. Choose a different key.

**Q: My key binding isn't working in Practice mode**
- A: Make sure you're in fullscreen mode. Keyboard bindings only work in fullscreen.

**Q: How do I reset all key bindings?**
- A: Click "🔄 Reset to Default Drum Kit" in the modal footer. This resets both sounds and key bindings.

**Q: Can I use number keys or special characters?**
- A: Currently, only letters (A-Z) and Space are supported. This keeps the interface simple and prevents conflicts with browser shortcuts.
