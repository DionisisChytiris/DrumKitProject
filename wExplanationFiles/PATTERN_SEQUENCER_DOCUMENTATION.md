# PatternSequencer Component Documentation

## Overview

The `PatternSequencer` is a React component that provides a step-sequencer interface for creating, editing, playing, and managing drum patterns. It allows users to create rhythmic patterns by activating drum hits on a grid-based timeline, similar to classic drum machines and DAW sequencers.

## Table of Contents

1. [Component Purpose](#component-purpose)
2. [Props Interface](#props-interface)
3. [Data Structures](#data-structures)
4. [State Management](#state-management)
5. [Core Functionality](#core-functionality)
6. [Helper Functions](#helper-functions)
7. [User Interface](#user-interface)
8. [LocalStorage Persistence](#localstorage-persistence)
9. [Playback System](#playback-system)
10. [Pattern Management](#pattern-management)
11. [Technical Details](#technical-details)

---

## Component Purpose

The PatternSequencer enables users to:
- Create drum patterns by clicking on a grid (steps × drums)
- Play patterns in a loop with adjustable BPM
- Save and load multiple patterns
- Clear patterns to start fresh
- Create new empty patterns
- Automatically persist patterns to browser localStorage
- Adapt patterns when the drum kit structure changes

---

## Props Interface

```typescript
interface PatternSequencerProps {
  drumKit: DrumPiece[];  // Array of drum pieces (kick, snare, hihat, etc.)
  bpm?: number;         // Optional initial BPM (defaults to 120)
}
```

### Props Explanation

- **`drumKit`** (required): An array of `DrumPiece` objects representing the available drums. Each drum must have:
  - `id`: Unique identifier
  - `name`: Display name
  - `audioUrl`: URL to the audio file for playback
  - Other properties (type, position, size, keyBinding) are optional

- **`bpm`** (optional): Initial beats per minute for the pattern. Defaults to 120 if not provided.

---

## Data Structures

### PatternStep Interface

```typescript
interface PatternStep {
  drumId: string;    // ID of the drum piece
  velocity: number;  // Velocity/volume (0-1, typically 0.8)
  active: boolean;   // Whether this step is activated
}
```

### Pattern Interface

```typescript
interface Pattern {
  id: string;                    // Unique pattern identifier
  name: string;                  // User-friendly pattern name
  steps: PatternStep[][];        // 2D array: [stepIndex][drumIndex]
  bpm: number;                   // Beats per minute
  length: number;                // Number of steps (typically 16)
  createdAt?: string;             // ISO timestamp of creation
  updatedAt?: string;           // ISO timestamp of last update
}
```

### Pattern Structure Example

A pattern with 16 steps and 3 drums (kick, snare, hihat) would look like:

```typescript
{
  id: "pattern-1234567890",
  name: "My Groove",
  steps: [
    // Step 0
    [
      { drumId: "kick", velocity: 0.8, active: true },
      { drumId: "snare", velocity: 0.8, active: false },
      { drumId: "hihat", velocity: 0.8, active: true }
    ],
    // Step 1
    [
      { drumId: "kick", velocity: 0.8, active: false },
      { drumId: "snare", velocity: 0.8, active: false },
      { drumId: "hihat", velocity: 0.8, active: false }
    ],
    // ... 14 more steps
  ],
  bpm: 120,
  length: 16,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

---

## State Management

The component uses React hooks for state management:

### Primary State

```typescript
const [pattern, setPattern] = useState<Pattern>(() => {
  // Initializes from localStorage or creates new pattern
});
```

- **`pattern`**: Current pattern being edited/played
- Initialized on mount: tries to load saved pattern from localStorage, otherwise creates new empty pattern

### Secondary State

```typescript
const [savedPatterns, setSavedPatterns] = useState<Pattern[]>(loadPatterns());
const [isPlaying, setIsPlaying] = useState(false);
const [currentStep, setCurrentStep] = useState(0);
const [playbackInterval, setPlaybackInterval] = useState<number | null>(null);
const [showSaveDialog, setShowSaveDialog] = useState(false);
const [showLoadDialog, setShowLoadDialog] = useState(false);
const [patternName, setPatternName] = useState(pattern.name);
```

- **`savedPatterns`**: Array of all saved patterns
- **`isPlaying`**: Boolean indicating if playback is active
- **`currentStep`**: Index of the currently playing step (0-15)
- **`playbackInterval`**: Reference to the setInterval timer for playback
- **`showSaveDialog`**: Controls save dialog visibility
- **`showLoadDialog`**: Controls load dialog visibility
- **`patternName`**: Current pattern name (can be edited)

### Refs

```typescript
const isInitialMount = useRef(true);
const prevDrumKitIds = useRef<string>(drumKit.map(d => d.id).join(','));
```

- **`isInitialMount`**: Prevents auto-save on initial component mount
- **`prevDrumKitIds`**: Tracks drum kit structure changes to normalize patterns

---

## Core Functionality

### 1. Pattern Initialization

On component mount, the sequencer:
1. Attempts to load saved patterns from localStorage
2. Checks for a previously active pattern ID
3. If found, loads and normalizes that pattern to match current drum kit
4. If not found, creates a new empty pattern with 16 steps

### 2. Step Toggling

```typescript
const toggleStep = (stepIndex: number, drumId: string) => {
  // Toggles the active state of a specific step for a specific drum
  // Updates pattern with new timestamp
}
```

- Clicking a step button toggles its `active` state
- Updates the pattern immediately
- Triggers auto-save (after initial mount)

### 3. Pattern Playback

```typescript
const startPlayback = () => {
  // Starts or stops pattern playback
  // Uses setInterval to trigger steps at calculated intervals
}
```

**Playback Logic:**
- Calculates step interval: `(60 / bpm) * 1000 * 4 / pattern.length`
  - `60 / bpm`: Seconds per beat
  - `* 1000`: Convert to milliseconds
  - `* 4`: Assumes 4/4 time signature (4 beats per measure)
  - `/ pattern.length`: Divide by number of steps (typically 16)
- Loops through steps: `step = (step + 1) % pattern.length`
- Plays all active drums for each step simultaneously
- Updates `currentStep` for visual feedback

**Playback Calculation Example:**
- BPM: 120
- Pattern length: 16 steps
- Interval: `(60 / 120) * 1000 * 4 / 16 = 0.5 * 1000 * 4 / 16 = 125ms` per step

### 4. Playing Steps

```typescript
const playStep = useCallback((stepIndex: number) => {
  // Plays all active drums for a given step
  // Uses enhancedAudioManager to play sounds with velocity
}, [pattern.steps, drumKit]);
```

- Iterates through all pattern steps at the given index
- For each active step, finds the corresponding drum piece
- Calls `enhancedAudioManager.playSound()` with:
  - `drum.id`: Unique drum identifier
  - `drum.audioUrl`: Audio file URL
  - `patternStep.velocity`: Velocity value (0-1)

---

## Helper Functions

### LocalStorage Functions

#### `savePatterns(patterns: Pattern[])`
- Saves array of patterns to localStorage
- Uses key: `'drumKitSequencerPatterns'`
- Handles errors gracefully with try-catch

#### `loadPatterns(): Pattern[]`
- Loads all saved patterns from localStorage
- Returns empty array if none exist or on error

#### `saveCurrentPattern(patternId: string)`
- Saves the ID of the currently active pattern
- Uses key: `'drumKitSequencerCurrentPattern'`
- Allows restoration of last active pattern on reload

#### `loadCurrentPatternId(): string | null`
- Retrieves the ID of the last active pattern
- Returns `null` if none exists

### Pattern Creation Functions

#### `createEmptyPattern(drumKit: DrumPiece[], bpm: number): Pattern`
- Creates a new empty pattern with:
  - Unique ID: `pattern-${Date.now()}`
  - Default name: `'New Pattern'`
  - 16 steps (all inactive)
  - All drums included in each step with default velocity (0.8)
  - Current timestamp for `createdAt` and `updatedAt`

#### `normalizePattern(p: Pattern, kit: DrumPiece[]): Pattern`
- **Critical function** for pattern compatibility
- Ensures pattern matches current drum kit structure
- Handles cases where:
  - Drum kit has changed (drums added/removed)
  - Pattern was created with different drum kit
- For each step:
  - Maps current drum kit to pattern steps
  - Preserves existing step data if drum exists
  - Creates new inactive steps for new drums
  - Removes steps for drums that no longer exist

**Normalization Example:**
```typescript
// Old pattern had: [kick, snare]
// New drum kit has: [kick, snare, hihat]
// Result: Pattern now includes hihat (inactive) for all steps
```

---

## User Interface

### Main Controls

1. **Play/Stop Button** (▶/⏸)
   - Toggles playback
   - Visual state: Green when stopped, Red when playing
   - Tooltip shows current action

2. **Clear Button** (🗑)
   - Deactivates all steps in current pattern
   - Does not delete the pattern

3. **Save Button** (💾)
   - Opens save dialog
   - Allows naming/renaming pattern
   - Saves to localStorage

4. **Load Button** (📂)
   - Opens load dialog
   - Shows list of all saved patterns
   - Displays pattern metadata (BPM, steps, date)
   - Allows loading or deleting patterns

5. **New Button** (➕)
   - Creates new empty pattern
   - Stops playback if active
   - Resets to default pattern

6. **BPM Control**
   - Number input (60-200 range)
   - Updates pattern BPM in real-time
   - Restarts playback if currently playing

### Pattern Name Input

- Editable text input
- Updates pattern name on blur
- Validates non-empty name
- Reverts to previous name if empty

### Sequencer Grid

**Layout:**
- Horizontal: Step numbers (1-16)
- Vertical: Drum rows (one per drum in kit)
- Grid cells: Step buttons (clickable)

**Step Button States:**
- **Inactive**: Empty button
- **Active**: Shows filled circle (●)
- **Current**: Highlighted when playing (visual feedback)

**Visual Feedback:**
- Step numbers highlight when playing
- Current step button has special styling
- Active steps show filled circle indicator

### Dialogs

#### Save Dialog
- Modal overlay with backdrop
- Text input for pattern name
- Save and Cancel buttons
- Validates name before saving

#### Load Dialog
- Modal overlay with backdrop
- List of saved patterns showing:
  - Pattern name
  - BPM
  - Number of steps
  - Last updated date
- Each pattern has Load and Delete buttons
- Close button to dismiss

---

## LocalStorage Persistence

### Storage Keys

1. **`'drumKitSequencerPatterns'`**
   - Stores array of all saved patterns
   - JSON stringified
   - Persists across browser sessions

2. **`'drumKitSequencerCurrentPattern'`**
   - Stores ID of currently active pattern
   - Allows restoration of last edited pattern
   - Single string value

### Auto-Save Mechanism

The component automatically saves patterns when:
- Steps are toggled (activated/deactivated)
- BPM is changed
- Pattern name is changed

**Auto-Save Logic:**
```typescript
useEffect(() => {
  if (isInitialMount.current) {
    isInitialMount.current = false;
    return; // Skip on initial mount
  }
  
  // Save pattern to localStorage
  // Update savedPatterns state
  // Save current pattern ID
}, [pattern.steps, pattern.bpm, pattern.name, pattern.id]);
```

**Important:** Auto-save is skipped on initial mount to prevent overwriting loaded patterns.

### Pattern Normalization on Load

When loading patterns:
1. Pattern is retrieved from localStorage
2. `normalizePattern()` is called to match current drum kit
3. Pattern structure is updated if drum kit changed
4. Pattern is set as current

This ensures patterns remain compatible even if the drum kit structure changes.

---

## Playback System

### Timing Calculation

The playback system uses `setInterval` to trigger steps at calculated intervals:

```typescript
const interval = setInterval(() => {
  playStep(step);
  setCurrentStep(step);
  step = (step + 1) % pattern.length;
}, (60 / pattern.bpm) * 1000 * 4 / pattern.length);
```

**Formula Breakdown:**
- `60 / pattern.bpm`: Seconds per beat
- `* 1000`: Convert to milliseconds
- `* 4`: 4 beats per measure (4/4 time)
- `/ pattern.length`: Divide by number of steps

**Example Calculations:**

| BPM | Pattern Length | Interval (ms) | Notes per Second |
|-----|---------------|---------------|------------------|
| 60  | 16            | 250           | 4                |
| 120 | 16            | 125           | 8                |
| 180 | 16            | 83.33         | 12               |

### Playback Lifecycle

1. **Start Playback:**
   - Sets `isPlaying` to `true`
   - Creates interval timer
   - Stores interval reference in state
   - Begins at step 0

2. **During Playback:**
   - Interval triggers `playStep()` for each step
   - Updates `currentStep` for visual feedback
   - Loops: `step = (step + 1) % pattern.length`

3. **Stop Playback:**
   - Clears interval timer
   - Sets `isPlaying` to `false`
   - Resets `currentStep` to 0
   - Cleans up interval reference

4. **Cleanup:**
   - `useEffect` cleanup function clears interval on unmount
   - Prevents memory leaks

### Audio Playback

Uses `enhancedAudioManager` for audio playback:

```typescript
enhancedAudioManager.playSound(
  drum.id,           // Unique drum identifier
  drum.audioUrl,     // Audio file URL
  patternStep.velocity // Velocity (0-1)
);
```

The `enhancedAudioManager` handles:
- Audio file loading and caching
- Audio context management
- Effects processing (reverb, compression, EQ)
- Velocity-sensitive volume control

---

## Pattern Management

### Creating Patterns

**New Pattern:**
- Click "New" button
- Creates empty pattern with 16 steps
- All steps inactive
- Default name: "New Pattern"
- Stops playback if active

**Empty Pattern Structure:**
```typescript
{
  id: `pattern-${Date.now()}`,
  name: 'New Pattern',
  steps: Array(16).fill(null).map(() => 
    drumKit.map(drum => ({ 
      drumId: drum.id, 
      velocity: 0.8, 
      active: false 
    }))
  ),
  bpm: 120,
  length: 16,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}
```

### Saving Patterns

**Save Process:**
1. User clicks "Save" button
2. Save dialog opens
3. User enters/edits pattern name
4. User clicks "Save" in dialog
5. Pattern is validated (name must not be empty)
6. Pattern is added/updated in `savedPatterns` array
7. Patterns array is saved to localStorage
8. Current pattern ID is saved
9. Dialog closes

**Save Logic:**
```typescript
const handleSavePattern = () => {
  // Validate name
  // Create pattern object with updated name and timestamp
  // Remove old version if exists
  // Add updated pattern
  // Save to localStorage
  // Update state
};
```

### Loading Patterns

**Load Process:**
1. User clicks "Load" button
2. Load dialog opens
3. List of saved patterns is displayed
4. User clicks "Load" on desired pattern
5. Pattern is normalized to match current drum kit
6. Pattern is set as current
7. Pattern name is updated
8. Current pattern ID is saved
9. Playback stops if active
10. Dialog closes

**Load Logic:**
```typescript
const handleLoadPattern = (patternToLoad: Pattern) => {
  // Stop playback if active
  // Normalize pattern to current drum kit
  // Set as current pattern
  // Update pattern name
  // Save current pattern ID
  // Close dialog
};
```

### Deleting Patterns

**Delete Process:**
1. User clicks "Delete" on a pattern in load dialog
2. Confirmation dialog appears
3. User confirms deletion
4. Pattern is removed from `savedPatterns` array
5. Patterns array is saved to localStorage
6. If deleted pattern was current, new empty pattern is created

**Delete Logic:**
```typescript
const handleDeletePattern = (patternId: string) => {
  // Confirm deletion
  // Remove from savedPatterns
  // Save to localStorage
  // If was current pattern, create new empty pattern
};
```

### Clearing Patterns

**Clear Process:**
1. User clicks "Clear" button
2. All steps in current pattern are deactivated
3. Pattern structure remains (steps, BPM, name)
4. Pattern is updated with new timestamp
5. Auto-save triggers

**Clear Logic:**
```typescript
const handleClearPattern = () => {
  // Map through all steps
  // Set all active flags to false
  // Update pattern with new timestamp
};
```

---

## Technical Details

### React Hooks Usage

#### `useState`
- Manages component state (pattern, playback, dialogs, etc.)
- Lazy initialization for pattern state (loads from localStorage)

#### `useEffect`
- **Auto-save effect**: Watches pattern changes and saves to localStorage
- **Pattern name sync**: Updates patternName when pattern.name changes
- **Drum kit normalization**: Watches drum kit changes and normalizes pattern
- **Cleanup**: Clears interval on unmount

#### `useCallback`
- `playStep`: Memoized to prevent unnecessary re-renders
- Dependencies: `pattern.steps`, `drumKit`

#### `useRef`
- `isInitialMount`: Tracks if component just mounted (prevents auto-save on mount)
- `prevDrumKitIds`: Tracks drum kit structure changes

### TypeScript Types

All types are imported from `@/types`:
- `Pattern`: Pattern data structure
- `PatternStep`: Individual step data
- `DrumPiece`: Drum piece definition

### CSS Styling

Component uses `PatternSequencer.css` for styling:
- Scoped selectors (`.pattern-sequencer .play-button`) to avoid conflicts
- Tooltip styling with `::before` and `::after` pseudo-elements
- Responsive grid layout
- Visual feedback for active/current steps

### Audio Integration

Uses `enhancedAudioManager` from `@/utils/enhancedAudioManager`:
- Handles audio file loading
- Manages audio context
- Applies effects (reverb, compression, EQ)
- Supports velocity-sensitive playback

### Browser Compatibility

- **LocalStorage**: Requires modern browser (IE8+, all modern browsers)
- **AudioContext**: Requires browser with Web Audio API support
- **setInterval**: Standard JavaScript, all browsers support

### Performance Considerations

1. **Pattern Normalization**: Only runs when drum kit structure changes
2. **Auto-Save**: Debounced by React's effect system (only on dependency changes)
3. **Audio Caching**: `enhancedAudioManager` caches audio files
4. **Memoization**: `playStep` is memoized with `useCallback`
5. **Interval Cleanup**: Properly cleaned up on unmount

### Error Handling

- **LocalStorage Errors**: Try-catch blocks around all localStorage operations
- **Pattern Loading**: Gracefully handles missing or corrupted data
- **Audio Playback**: Errors handled by `enhancedAudioManager`

---

## Usage Example

```typescript
import { PatternSequencer } from '@/components/PatternSequencer/PatternSequencer';
import { useAppSelector } from '@/store/hooks';

function MyComponent() {
  const { drumKit } = useAppSelector((state) => state.drumKit);
  
  return (
    <PatternSequencer 
      drumKit={drumKit} 
      bpm={120} 
    />
  );
}
```

---

## Future Enhancements

Potential improvements:
1. **Step Velocity Editing**: Allow per-step velocity adjustment
2. **Pattern Length**: Make pattern length configurable (8, 16, 32 steps)
3. **Time Signatures**: Support different time signatures (3/4, 7/8, etc.)
4. **Pattern Copy/Duplicate**: Clone existing patterns
5. **Pattern Export/Import**: JSON export/import functionality
6. **Undo/Redo**: Pattern editing history
7. **Quantization**: Snap steps to grid
8. **Pattern Templates**: Pre-made pattern templates
9. **Visual Waveform**: Show pattern as waveform
10. **MIDI Export**: Export patterns as MIDI files

---

## Summary

The `PatternSequencer` component is a comprehensive drum pattern sequencer that provides:
- ✅ Grid-based pattern creation
- ✅ Real-time playback with adjustable BPM
- ✅ Pattern persistence via localStorage
- ✅ Pattern management (save, load, delete, clear, new)
- ✅ Automatic pattern normalization for drum kit changes
- ✅ Visual feedback during playback
- ✅ Integration with enhanced audio system
- ✅ Responsive UI with tooltips and dialogs

The component is production-ready and handles edge cases like drum kit changes, browser compatibility, and error scenarios gracefully.
