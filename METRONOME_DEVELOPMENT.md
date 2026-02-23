# Metronome Development Documentation

## Overview
This document outlines all the features and improvements made to the Metronome component during development.

## Date: Today's Session

---

## Features Implemented

### 1. Responsive Design & Layout

#### Main Container Enhancement
- **Increased main container size**: Changed from `min-width: 280px` to `min-width: 380px` with `max-width: 500px`
- **Enhanced padding**: Increased from `1.5rem` to `2.5rem` for better spacing
- **Improved gaps**: Increased gap between elements from `1.5rem` to `2rem`

#### Responsive Breakpoints
The metronome now adapts to different screen sizes:

- **Extra Large (1920px+)**: Larger containers, bigger fonts, more spacing
- **Large (1440px-1919px)**: Balanced sizing for large monitors
- **Medium (1024px-1439px)**: Optimized for standard desktop screens
- **Small (768px-1023px)**: Side containers stack vertically
- **Mobile (up to 767px)**: Compact layout, smaller fonts, full-width containers
- **Extra Small (up to 480px)**: Minimal sizing for small phones

#### Subdivision Container
- **Fixed height**: Set to `60vh` (60% of viewport height) for consistent sizing
- **Responsive behavior**: Switches to `fit-content` on mobile devices
- **Proper positioning**: Absolute positioning on desktop, relative on mobile

---

### 2. Advanced Metronome Settings

#### Advanced Section Toggle
- **Advanced Button**: Added toggle button to switch between Basic and Advanced views
- **Replaces subdivision section**: When Advanced is active, it replaces the basic subdivision controls
- **Disabled during playback**: Advanced button is disabled when metronome is playing

#### Advanced Features

##### Denominator Control
- **Moved from basic section**: Denominator (2, 4, 8, 16) is now in Advanced section
- **Auto-subdivision sync**: When denominator changes, subdivision automatically updates:
  - Denominator 8 → Subdivision: Eighths
  - Denominator 16 → Subdivision: Sixteenths
  - Denominator 2 or 4 → Subdivision: Quarters

##### Accent Pattern
- **Dynamic button count**: Accent pattern buttons automatically match the time signature numerator
  - Example: 4/4 = 4 buttons, 7/4 = 7 buttons, 5/8 = 5 buttons
- **Customizable accents**: Users can toggle which beats are accented
- **Visual feedback**: Accented beats are highlighted in orange
- **Auto-preservation**: When numerator changes, existing accents are preserved where possible
- **Default accent**: First beat is always accented by default

##### Swing/Shuffle
- **Slider control**: 0-100% swing/shuffle feel
- **Placeholder feature**: UI implemented, timing logic can be enhanced in future

##### Visual Flash Intensity
- **Dynamic glow**: Controls the intensity of the beat circle's glow effect
- **Range**: 0-100% (0-1.0)
- **Real-time adjustment**: Changes apply immediately to the visual indicator

#### Advanced Section Styling
- **Compact design**: All elements sized to fit within 60vh container without scrolling
- **Reduced sizes**:
  - Buttons: 28px × 28px (accent pattern), 32px × 32px (denominator)
  - Fonts: 0.7rem-0.75rem
  - Gaps: 0.4rem-0.75rem
  - Sliders: 4px height, 12px thumb

---

### 3. Time Signature & Denominator Logic

#### Smart Subdivision Selection
When the denominator changes, the subdivision automatically updates:
```typescript
- Denominator 8 → Subdivision: 'eighths'
- Denominator 16 → Subdivision: 'sixteenths'  
- Denominator 2 or 4 → Subdivision: 'quarters'
```

#### Non-4/4 Time Signatures
Special handling for time signatures with denominators other than 4:

**For 5/8, 7/8, etc.:**
- Plays exactly the numerator number of clicks (e.g., 5 clicks for 5/8)
- No subdivisions or ghost notes
- Each click can be individually accented
- Correct interval spacing based on denominator:
  - Denominator 2: Half notes (2x interval)
  - Denominator 8: Eighth notes (0.5x interval)
  - Denominator 16: Sixteenth notes (0.25x interval)

**Implementation Details:**
- `getSubdivisionConfig()`: Returns only numerator beats when denominator ≠ 4
- `isMainClick()`: All beats are main clicks (no ghost notes) when denominator ≠ 4
- `getMainBeatNumber()`: Direct beat number calculation (no subdivision math) when denominator ≠ 4

---

### 4. Accent Pattern System

#### Dynamic Pattern Generation
- **Automatic sizing**: Pattern array length matches time signature numerator
- **State management**: Uses React state with functional updates to avoid dependency issues
- **Preservation logic**: When numerator changes:
  - Expanding: Existing accents are preserved, new beats default to unaccented
  - Shrinking: Only beats that fit are preserved
  - Default: First beat always accented if no accents exist

#### Visual Implementation
- **Button grid**: Flexbox layout with wrapping for many beats
- **Active state**: Orange highlight (`rgba(255, 152, 0)`) for accented beats
- **Hover effects**: Scale and color transitions
- **Disabled state**: Buttons disabled during playback

#### Audio Integration
- **Volume differentiation**: Accented beats play louder (baseVolume: 0.28) than regular beats (0.25)
- **Pitch variation**: Accented beats use slightly higher frequency (700Hz vs 600Hz)
- **Downbeat priority**: First beat of measure (downbeat) still has highest priority

---

### 5. Component Structure

#### State Management
```typescript
- bpm: number (30-300)
- isPlaying: boolean
- beat: number (current beat in measure)
- subdivision: 'quarters' | 'eighths' | 'sixteenths' | 'triplets'
- timeSignature: number (2-19, numerator)
- timeSignatureDenom: number (2, 4, 8, 16, denominator)
- volume: number (0-1)
- clickSound: 'tick' | 'beep' | 'wood' | 'metallic'
- showAdvanced: boolean
- swing: number (0-100)
- accentPattern: boolean[] (dynamic length)
- visualFlashIntensity: number (0-1)
```

#### Key Functions

**`getSubdivisionConfig(sub, ts, tsDenom)`**
- Calculates beats per measure and interval multiplier
- Special handling for non-4 denominators

**`getMainBeatNumber(beat, sub, ts, tsDenom)`**
- Returns the main beat number (1 to numerator)
- Handles subdivisions for 4/4, direct calculation for others

**`isMainClick(beat, sub, tsDenom)`**
- Determines if current beat should be main click or ghost
- All beats are main clicks when denominator ≠ 4

**`playClick()`**
- Generates click sound using Web Audio API
- Applies accent pattern, volume, and click sound settings
- Differentiates downbeat, accented beats, main clicks, and ghost clicks

---

### 6. CSS Improvements

#### Responsive Styles
- Comprehensive media queries for all screen sizes
- Flexible layouts that adapt to viewport
- Proper overflow handling

#### Advanced Section Styling
- Compact button sizes
- Reduced font sizes
- Minimal gaps and padding
- No scrolling required within 60vh container

#### Visual Enhancements
- Smooth transitions and hover effects
- Color-coded active states
- Box shadows for depth
- Responsive typography

---

## Technical Details

### Web Audio API Integration
- Uses `AudioContext` for sound generation
- Oscillator types: sine, square, sawtooth, triangle
- Frequency modulation based on click type
- Gain nodes for volume control
- Exponential decay for click sound

### Interval Management
- Uses `setInterval` for beat timing
- Calculates interval based on BPM and subdivision
- Proper cleanup on component unmount
- Dynamic interval updates when settings change

### State Synchronization
- Multiple `useEffect` hooks for state coordination
- Functional state updates to avoid dependency issues
- Proper cleanup of intervals and audio contexts

---

## Future Enhancement Opportunities

1. **Swing/Shuffle Timing**: Implement actual timing variation for swing feel
2. **Tempo Ramp**: Gradual BPM increase/decrease over time
3. **Preset Patterns**: Save/load common metronome configurations
4. **Tap Tempo**: Tap to set BPM
5. **Count-in**: Optional count-in before starting
6. **Polyrhythms**: Multiple time signatures simultaneously
7. **Click Sound Per Beat**: Different sounds for different beat types
8. **Subdivision Patterns**: Dotted notes, syncopation patterns

---

## File Structure

```
src/screens/
├── Metronome.tsx          # Main component logic
└── styles/
    └── Metronome.css      # All styling and responsive design
```

---

## Usage Examples

### Basic Usage (4/4 Time)
1. Set BPM using input or slider
2. Choose subdivision (quarters, eighths, sixteenths, triplets)
3. Adjust time signature numerator (2-19)
4. Click Play

### Advanced Usage (5/8 Time)
1. Click "Advanced ►" button
2. Set denominator to 8 (subdivision auto-changes to eighths)
3. Set numerator to 5
4. Customize accent pattern (5 buttons appear)
5. Adjust volume and visual flash intensity
6. Click Play → Hears exactly 5 clicks with customizable accents

### Custom Accent Patterns
1. Open Advanced section
2. Set desired time signature (e.g., 7/4)
3. Toggle accent pattern buttons to accent specific beats
4. Accented beats will play louder and at higher pitch

---

## Notes

- All changes maintain backward compatibility with existing functionality
- The metronome works seamlessly in both basic and advanced modes
- Responsive design ensures usability across all device sizes
- Advanced features are optional and don't interfere with basic usage

---

## Conclusion

The metronome now provides a comprehensive, professional-grade timing tool with:
- ✅ Responsive design for all screen sizes
- ✅ Advanced customization options
- ✅ Proper handling of complex time signatures
- ✅ Customizable accent patterns
- ✅ Clean, intuitive user interface
- ✅ Professional audio quality

All features work together harmoniously to provide musicians with a powerful and flexible metronome tool.
