# SonicGate

Near-ultrasonic, air-gapped text transfer over speakers and microphones.

SonicGate is a Web Audio + Next.js experiment that transmits UART-framed data using FSK tones and decodes it in real time with a Goertzel-based detector.

> Experimental project: reliability depends on device audio hardware, environment, and browser behavior.

## Features

- Route-based UX: `/transmit` and `/receive`
- FSK modulation with configurable signal parameters
- UART framing (start bit + 8 data bits + stop bit)
- Audio-clocked scheduling using `AudioContext.currentTime`
- Goertzel detector for narrowband tone energy analysis
- Ambient calibration mode for dynamic noise-floor tuning
- Live spectrogram and terminal output
- Optional AES-256-GCM payload encryption/decryption pipeline
- Stealth mode for near-ultrasonic operation

## Table of Contents

- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## How It Works

### Transmit pipeline

1. User input is encoded to UTF-8 bytes.
2. Bytes are wrapped into UART frames:
    - `start(0) + 8 bits (LSB-first) + stop(1)`
3. If encryption is enabled, payload is wrapped as:
    - `@ENC:<base64>\n`
4. Each bit is mapped to FSK tones:
    - `0 -> baseFrequencyHz`
    - `1 -> baseFrequencyHz + separationHz`
5. Tones are emitted with `OscillatorNode` and shaped with `GainNode` ramps to reduce clicks.

### Receive pipeline

1. Microphone audio is captured via `getUserMedia`.
2. Symbol sampling runs against the audio clock (not wall-clock timers).
3. Goertzel computes tone energy for the configured frequency pair.
4. Bits are decoded through the UART state machine.
5. Chunks stream into terminal output.
6. If enabled, `@ENC:` lines are auto-decrypted before display.

### Calibration

Calibration measures ambient energy and updates detection thresholds to reduce false positives in noisy spaces.

## Architecture

- `ModemProvider` centralizes shared audio modem state and context lifecycle.
- DSP and crypto logic are isolated from UI panels.
- Hooks orchestrate stream processing, decryption, and visual outputs.

## Tech Stack

- Next.js (App Router)
- React + TypeScript (strict)
- Tailwind CSS
- Web Audio API
- Web Crypto API (AES-256-GCM + PBKDF2)

## Project Structure

```text
app/
   transmit/
   receive/
src/
   components/
      transmit/
      receive/
      shared/
   context/
   hooks/
   lib/
      dsp/
      crypto/
   types/
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Chrome/Edge recommended for Web Audio consistency

### Install

```bash
npm install
```

### Run (development)

```bash
npm run dev
```

Open `http://localhost:3000`.

### Validate

```bash
npm run lint
npm run build
```

## Usage

1. Open `/transmit` on Device A.
2. Open `/receive` on Device B and allow microphone access.
3. On `/receive`, click **Start Listen**.
4. (Optional) Run **Calibration** in the target environment.
5. On `/transmit`, set signal parameters and send payload.
6. If encryption is enabled, use the same passphrase on both sides.

## Troubleshooting

- **No decode output**
   - Increase volume and reduce distance between devices.
   - Lower baud rate (longer symbol duration).
   - Run calibration before transmission.
- **Frequent decode errors**
   - Disable OS/audio enhancements where possible.
   - Reduce background noise and avoid speaker clipping.
- **Encrypted output not readable**
   - Confirm both sides use the same passphrase.
   - Ensure payload lines are `@ENC:<base64>` framed.

## Roadmap

- Stronger framing with checksum/CRC
- Packet-level ACK/retry strategy
- Better device compatibility presets
- E2E reliability benchmarking tools

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Run `npm run lint` and `npm run build`
4. Open a PR with a clear summary and test notes

## License

MIT
