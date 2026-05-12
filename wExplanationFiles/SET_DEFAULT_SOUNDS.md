# How to Set Default Drum Kit Sounds

## Quick Guide

Default sounds are configured in `src/utils/drumConfig.ts` in the `defaultDrumKit` array.

## Method 1: Using getAudioPath() Helper (Recommended)

```typescript
{
  id: 'kick',
  // ... other properties
  audioUrl: getAudioPath('kick 1', 'wav'), // Uses: /audio/kick 1.wav
}
```

**For files with spaces:**
```typescript
audioUrl: getAudioPath('kick 1', 'wav'), // Handles spaces automatically
```

**For files without spaces:**
```typescript
audioUrl: getAudioPath('snare1', 'wav'), // Uses: /audio/snare1.wav
```

## Method 2: Direct Path (For Complex Filenames)

```typescript
{
  id: 'kick',
  // ... other properties
  audioUrl: '/audio/kick 1.wav', // Direct path (handles spaces)
}
```

## Examples

### Setting Kick to "kick 1.wav"
```typescript
{
  id: 'kick',
  name: 'Kick Drum',
  type: 'kick',
  // ... other properties
  audioUrl: getAudioPath('kick 1', 'wav'), // or '/audio/kick 1.wav'
}
```

### Setting Kick to "kick 2.wav"
```typescript
{
  id: 'kick',
  name: 'Kick Drum',
  type: 'kick',
  // ... other properties
  audioUrl: getAudioPath('kick 2', 'wav'), // or '/audio/kick 2.wav'
}
```

### Setting Snare to "snare1.wav"
```typescript
{
  id: 'snare',
  name: 'Snare Drum',
  type: 'snare',
  // ... other properties
  audioUrl: getAudioPath('snare1', 'wav'), // Already set!
}
```

### Using Generated Tone (No Audio File)
```typescript
{
  id: 'kick',
  // ... other properties
  audioUrl: undefined, // Will use generateTone() fallback
}
```

## All Default Sound Locations

Edit these in `src/utils/drumConfig.ts`:

- **Kick**: Line ~46
- **Snare**: Line ~56
- **Hi-Hat**: Line ~66
- **Crash**: Line ~76
- **Crash 2**: Line ~86
- **High Tom**: Line ~96
- **Mid Tom**: Line ~106
- **Floor Tom**: Line ~116
- **Ride**: Line ~126
- **Low Floor Tom**: Line ~136
- **China**: Line ~146

## Important Notes

1. **File must exist**: The file must be in `public/audio/` folder
2. **Spaces are OK**: Files with spaces work fine (e.g., "kick 1.wav")
3. **Case sensitive**: Filenames are case-sensitive
4. **Reset button**: Users can reset to these defaults using "🔄 Reset to Default Drum Kit" button

## Current Defaults

- **Kick**: `kick 1.wav` (you can change to `kick 2.wav`)
- **Snare**: `snare1.wav`
- **Others**: Will use `generateTone()` until you add files

## After Changing Defaults

1. Save the file
2. Refresh the browser (or restart dev server)
3. The new defaults will be used
4. Users who click "Reset to Default" will get these sounds
