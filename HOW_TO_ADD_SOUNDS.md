# How to Add More Sounds to Customization

## Quick Steps

### 1. Add Your Audio File
Place your audio file in `public/audio/` folder:
```
public/audio/kick1.wav
public/audio/snare2.wav
public/audio/crash1.wav
etc.
```

### 2. Register It in Config
Open `src/utils/audioFilesConfig.ts` and add an entry:

```typescript
kick: [
  { id: 'kick-1', name: 'Kick 1', file: 'kick1.wav', type: 'kick' },
],
```

### 3. That's It!
The file will automatically appear in the customization modal for users to select!

## Examples

### Adding a Kick Drum Sound
1. Add file: `public/audio/kick1.wav`
2. Update `audioFilesConfig.ts`:
   ```typescript
   kick: [
     { id: 'kick-1', name: 'Kick 1', file: 'kick1.wav', type: 'kick' },
   ],
   ```

### Adding Multiple Snare Sounds
1. Add files: `public/audio/snare2.wav`, `public/audio/snare3.wav`
2. Update `audioFilesConfig.ts`:
   ```typescript
   snare: [
     { id: 'snare-1', name: 'Snare 1', file: 'snare1.wav', type: 'snare' },
     { id: 'snare-2', name: 'Snare 2', file: 'snare2.wav', type: 'snare' },
     { id: 'snare-3', name: 'Snare 3', file: 'snare3.wav', type: 'snare' },
   ],
   ```

## Drum Types

Files are organized by drum type. Each type works for multiple drums:

- **`kick`** → Kick Drum
- **`snare`** → Snare Drum
- **`tom`** → High Tom, Mid Tom, Floor Tom, Low Floor Tom (all toms share the same pool)
- **`cymbal`** → Crash, Crash 2, Ride, China (all cymbals share the same pool)
- **`hihat`** → Hi-Hat

## File Format

```typescript
{
  id: 'unique-id',        // Unique identifier (e.g., 'kick-1', 'snare-2')
  name: 'Display Name',   // Name shown to users (e.g., 'Kick 1', 'Snare 2')
  file: 'filename.wav',   // Exact filename in public/audio/ (e.g., 'kick1.wav')
  type: 'kick',           // Drum type: 'kick', 'snare', 'tom', 'cymbal', 'hihat'
}
```

## Supported Audio Formats

- `.wav` (recommended for quality)
- `.mp3` (smaller file size)
- `.ogg` (web-friendly)

## Reset to Default

Users can click the **"🔄 Reset to Default Drum Kit"** button at the bottom of the customization modal to reset all drums to their default sounds from `drumConfig.ts`.

## Current Files

Check `src/utils/audioFilesConfig.ts` to see all registered files.
