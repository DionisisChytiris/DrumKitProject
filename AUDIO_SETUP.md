# Audio Samples Setup Guide

## 📁 Where to Add Your Audio Files

Place your drum and cymbal audio samples in:
```
public/audio/
```

## 🎵 File Naming Convention

Name your files exactly as shown below (case-sensitive):

| Drum Piece | File Name | Example |
|------------|-----------|---------|
| Kick Drum | `kick.mp3` (or `.wav`, `.ogg`) | `kick.wav` |
| Snare Drum | `snare.mp3` | `snare.wav` |
| Hi-Hat | `hihat.mp3` | `hihat.wav` |
| Crash Cymbal | `crash.mp3` | `crash.wav` |
| Crash Cymbal 2 | `crash-2.mp3` | `crash-2.wav` |
| High Tom | `high-tom.mp3` | `high-tom.wav` |
| Mid Tom | `mid-tom.mp3` | `mid-tom.wav` |
| Floor Tom | `floor-tom.mp3` | `floor-tom.wav` |
| Low Floor Tom | `low-floor-tom.mp3` | `low-floor-tom.wav` |
| Ride Cymbal | `ride.mp3` | `ride.wav` |
| China Cymbal | `china.mp3` | `china.wav` |

## 📝 Supported Audio Formats

- **MP3** (`.mp3`) - Recommended for web (smaller file size)
- **WAV** (`.wav`) - Best quality, larger files
- **OGG** (`.ogg`) - Good compression, web-friendly

## 🔧 How to Change the Default Format

If you want to use `.wav` instead of `.mp3` by default, edit `src/utils/drumConfig.ts`:

```typescript
const getAudioPath = (id: string, extension: string = 'wav'): string => {
  return `/audio/${id}.${extension}`;
};
```

Or specify different formats for each drum:

```typescript
{
  id: 'kick',
  // ... other properties
  audioUrl: getAudioPath('kick', 'wav'), // Use .wav for kick
},
{
  id: 'snare',
  // ... other properties
  audioUrl: getAudioPath('snare', 'mp3'), // Use .mp3 for snare
},
```

## 🎯 How It Works

1. **If audio file exists**: The system plays your audio file
2. **If audio file is missing**: The system falls back to `generateTone()` in `audioManager.ts`

## 📂 Example Directory Structure

```
DrumKitProject/
├── public/
│   └── audio/
│       ├── kick.wav
│       ├── snare.wav
│       ├── hihat.wav
│       ├── crash.wav
│       ├── crash-2.wav
│       ├── high-tom.wav
│       ├── mid-tom.wav
│       ├── floor-tom.wav
│       ├── low-floor-tom.wav
│       ├── ride.wav
│       └── china.wav
└── src/
    └── utils/
        └── drumConfig.ts  ← Audio paths are configured here
```

## ✅ Testing

1. Add your audio files to `public/audio/`
2. Start the dev server: `npm run dev`
3. Navigate to the Practice page
4. Click on drums or press keyboard keys
5. You should hear your custom audio files!

## 🐛 Troubleshooting

**No sound plays:**
- Check browser console for 404 errors
- Verify file names match exactly (case-sensitive)
- Check file format is supported (.mp3, .wav, .ogg)
- Ensure files are in `public/audio/` folder

**Still hearing generated tones:**
- The audio file might not be found (check console for 404)
- File name doesn't match the drum ID exactly
- File format not supported by browser

**Files not loading:**
- Restart the dev server after adding new files
- Clear browser cache
- Check that files are in `public/audio/` (not `src/audio/`)

## 📍 Key Files

- **Audio Configuration**: `src/utils/drumConfig.ts`
- **Audio Manager**: `src/utils/audioManager.ts`
- **Audio Files Location**: `public/audio/`
