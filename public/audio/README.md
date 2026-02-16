# Audio Samples Directory

Place your drum and cymbal audio samples in this folder.

## File Naming Convention

Name your audio files according to the drum piece IDs:

- `kick.mp3` (or `.wav`, `.ogg`) - Kick drum
- `snare.mp3` - Snare drum
- `hihat.mp3` - Hi-hat
- `crash.mp3` - Crash cymbal
- `crash-2.mp3` - Second crash cymbal
- `high-tom.mp3` - High tom
- `mid-tom.mp3` - Mid tom
- `floor-tom.mp3` - Floor tom
- `low-floor-tom.mp3` - Low floor tom
- `ride.mp3` - Ride cymbal
- `china.mp3` - China cymbal

## Supported Formats

- MP3 (`.mp3`)
- WAV (`.wav`)
- OGG (`.ogg`)

## How It Works

1. Place your audio files in this `public/audio/` folder
2. The files will be automatically served at `/audio/filename.ext`
3. The `drumConfig.ts` file references these files
4. If a file is missing, the system will fall back to generated tones

## Example Structure

```
public/
  audio/
    kick.wav
    snare.wav
    hihat.wav
    crash.wav
    crash-2.wav
    high-tom.wav
    mid-tom.wav
    floor-tom.wav
    low-floor-tom.wav
    ride.wav
    china.wav
```
