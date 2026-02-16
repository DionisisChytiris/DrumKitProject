# Adding Audio Files to Customization

## Quick Steps

1. **Add your audio file** to `public/audio/` folder
   - Example: `public/audio/kick1.wav`

2. **Register it** in `src/utils/audioFilesConfig.ts`
   ```typescript
   kick: [
     { id: 'kick-1', name: 'Kick 1', file: 'kick1.wav', type: 'kick' },
   ],
   ```

3. **That's it!** The file will automatically appear in the Customize modal

## Example: Adding a New Snare File

1. Add file: `public/audio/snare2.wav`

2. Update `src/utils/audioFilesConfig.ts`:
   ```typescript
   snare: [
     { id: 'snare-1', name: 'Snare 1', file: 'snare1.wav', type: 'snare' },
     { id: 'snare-2', name: 'Snare 2', file: 'snare2.wav', type: 'snare' }, // Add this
   ],
   ```

3. Users can now select "Snare 2" from the customization modal!

## How It Works

- **Files in `public/audio/`** → Available in customization modal
- **User selections** → Saved to Redux → Saved to localStorage
- **Changes apply immediately** → Test on Practice page in real-time

## File Format

```typescript
{
  id: 'unique-id',        // Unique identifier (e.g., 'kick-1')
  name: 'Display Name',    // Name shown to users (e.g., 'Kick 1')
  file: 'filename.wav',   // Filename in public/audio/ (e.g., 'kick1.wav')
  type: 'kick',            // Drum type: 'kick', 'snare', 'tom', 'cymbal', 'hihat'
}
```

## Supported Formats

- `.wav` (recommended for quality)
- `.mp3` (smaller file size)
- `.ogg` (web-friendly)

## Current Files

Check `src/utils/audioFilesConfig.ts` to see all registered files.
