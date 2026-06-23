# Play-Along Exercises — Plain English Guide

This guide explains **play-along exercises** in simple terms. You do not need to know programming or music software to understand how they work in this app.

If you want technical details (file names, code, diagrams), read **[PLAY_ALONG_EXERCISES.md](./PLAY_ALONG_EXERCISES.md)**.

---

## What is a play-along exercise?

Think of it like **karaoke for drum notation**:

- You see a **written drum part** on screen (the sheet music).
- You hear a **backing recording** (a WAV audio file) of that part being played.
- As the recording plays, the notes on the score **light up** so you can follow along.
- You can **slow down or speed up** the recording without changing the pitch (within limits).
- You can turn on a **metronome click** to help your timing.

You are **not** playing the virtual drum kit in this mode. You are **listening and reading** the music in sync.

---

## Where do I find it?

1. Open the app.
2. Go to **Exercises**.
3. Look for the **Play-along** section (separate from the simpler **Rhythm** exercises).
4. Tap an exercise name (for example **Snare 1**).
5. The player opens with the score and controls.

---

## What’s on the screen?

| What you see | What it does |
| --- | --- |
| **Title** | Name of the exercise |
| **Progress bar** | Roughly how far through the piece you are |
| **Big score area** | The drum notation (MusicXML rendered as graphics) |
| **Tempo knob** | Speed of the recording (like a “slow down / speed up” control) |
| **Volume knob** | How loud the backing track is |
| **Play / Stop button** | Starts or stops everything |
| **Metronome button** | Turns click sounds on or off during playback |
| **Theme button** | Switches score between dark and light colors |
| **Fullscreen button** | Makes the player fill the screen |

---

## What happens when I press Play?

Playback happens in **two steps**:

### Step 1 — Count-in (4 beats)

Before the recording starts, you get a **count-in**, like a teacher saying “1, 2, 3, 4”:

- You hear **four clicks** at the tempo you chose.
- Dots on screen show which beat you’re on (1 → 2 → 3 → 4).
- The first click is usually a little stronger (the “1”).

### Step 2 — The exercise starts

- After beat 4, there is **one more beat of space**.
- Then the **backing track starts from the beginning**.
- Notes on the score **highlight in orange** as they match the audio.

So: count-in prepares you; the real performance starts on the **next downbeat** after “4”.

---

## The two files behind each exercise

Every play-along uses **two files** stored in the project:

| File type | What it is | Example |
| --- | --- | --- |
| **MusicXML** (`.musicxml`) | The written score — which notes, when | `public/scores/snare1.musicxml` |
| **WAV** (`.wav`) | The audio recording you hear | `public/playalongs/snare1.wav` |

The app loads both and tries to keep them **in time with each other**.

**Important for anyone making content:** The recording should match the score. If the score says 120 BPM but the WAV was recorded at a different feel, things may look or sound slightly off.

---

## Tempo — why “slow down” still looks correct

There are two tempo ideas working together:

1. **Score tempo** — How fast the music was **written** (from the MusicXML file).
2. **Your tempo** — How fast **you** want to practice (the Tempo knob).

When you turn the tempo knob:

- The **audio slows down or speeds up**.
- The **highlights on the notes** stay matched to the audio, because they both use the same recording timeline.

So if you practice at half speed, the orange notes still appear at the right moments in the recording — just slower.

**Range:** Roughly 40 to 240 on the knob; very extreme speeds are limited so audio doesn’t sound broken.

---

## The metronome button (next to the theme button)

This is **optional**. It is **not** required to use play-along.

- **Off** — You only hear the backing track.
- **On** — You also hear steady **click** sounds on each beat, using the same click style and volume you set on the main **Metronome** page in the app.

During a play-along:

- Clicks are on **quarter notes** (one click per main beat), same idea as the count-in.
- Clicks follow the **tempo knob** and stay tied to the recording.
- You can turn the metronome **on or off while the exercise is playing**; it tries to join on the next beat instead of starting randomly.
- When the song **ends**, the metronome **turns off by itself**.

The count-in always uses clicks (when you press Play). The metronome button only affects clicks **during** the exercise after the count-in.

---

## What gets saved in your browser?

Some choices are remembered next time you open the app:

| Remembered | Not remembered |
| --- | --- |
| Backing track volume | Tempo (resets from the score when you reload) |
| Metronome on/off preference* | Whether you were mid-song |
| Dark or light score theme | |

\*If the metronome was on during a song, it turns off when the song finishes — but your general preference may still be saved for the next visit.

Nothing is sent to a server. Everything stays **on your computer** in browser storage.

---

## Play vs Stop

| Button | What happens |
| --- | --- |
| **Play** | Count-in → backing track plays → notes highlight |
| **Stop** (same button while playing) | Audio stops, goes back to the start, highlights clear |

If the recording reaches the end naturally, it stops like Stop, clears highlights, and turns off the metronome.

---

## How is this different from other Exercises?

On the **Exercises** page you may see two groups:

| | **Rhythm** (VexFlow) | **Play-along** |
| --- | --- | --- |
| **Notation** | Simple patterns drawn in the app | Full drum score from MusicXML |
| **Audio** | Usually metronome / beeps only | Full backing WAV |
| **Best for** | Reading rhythms, basics | Following a real part with recording |

They are separate features that share the same Exercises menu.

---

## Adding a new play-along (simple checklist)

If you want a new exercise in the app:

1. **Write or export** the drum part as MusicXML.
2. **Record or export** a matching WAV (same performance, starting together with the score).
3. Put files in:
   - `public/scores/` for the XML
   - `public/playalongs/` for the WAV
4. Add a short entry in `src/data/playAlongExercises.ts` (title, file paths, default speed).

A developer (or you, following the technical doc) adds one block to the list. You do **not** need a new screen or new button for each song.

---

## When things don’t feel “in sync”

Common reasons in everyday language:

| Problem | What might be wrong |
| --- | --- |
| Highlights **before** the sound | The WAV might have silence at the start; trim the audio or adjust offset in config |
| Highlights **after** the sound | The score might start before the audio; adjust offset |
| Metronome feels “off” | Written tempo in the score might not match how the WAV was recorded |
| Count-in feels fine but song feels rushed | Usually fixed in the app by timing updates; if not, check that score and WAV start together |

The technical doc has a **troubleshooting** table with config field names (`playbackOffsetSeconds`, etc.).

---

## What this feature does **not** do

- No uploading files from inside the app (files are added to the project by a developer).
- No saving your performance or grades.
- No connecting electronic drums (MIDI) in play-along mode.
- No internet required after the app is loaded — it runs in the browser.

---

## Short summary

**Play-along** = sheet music + backing track + moving highlight + optional metronome + tempo control.

**Press Play** → 4-beat count-in → music starts → follow the orange notes.

**Use Tempo** to practice slower or faster. **Use Metronome** if you want extra clicks. **Use Stop** or wait until the end to finish.

For code, architecture, and diagrams, see **[PLAY_ALONG_EXERCISES.md](./PLAY_ALONG_EXERCISES.md)**.
