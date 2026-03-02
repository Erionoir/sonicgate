# SonicGate

Audible chime-style, air-gapped text transfer over speakers and microphones.

SonicGate is a Web Audio + Next.js experiment that transmits framed digital data as audible FSK tones and decodes it in real time with a Goertzel-based detector.

> Experimental project: reliability depends on device audio hardware, environment, and browser behavior.

## Features

- Route-based UX: `/transmit` and `/receive`
- Audible chime defaults tuned for cross-device reliability
- Configurable FSK modulation parameters
- Manchester line coding + UART framing
- Packet framing with preamble, sync word, length byte, and CRC-8 checksum
- Audio-clocked scheduling using `AudioContext.currentTime`
- Goertzel detector for narrowband tone energy analysis
- Ambient calibration mode for dynamic noise-floor tuning
- Live spectrogram and terminal output
- Optional AES-256-GCM payload encryption/decryption pipeline
- Optional stealth mode for near-ultrasonic operation

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
2. Payload is packetized as:
   - `preamble + sync + length + payload + crc8`
3. Packet bytes are wrapped into UART frames:
    - `start(0) + 8 bits (LSB-first) + stop(1)`
4. If encryption is enabled, payload is wrapped as:
    - `@ENC:<base64>\n`
5. UART bits are Manchester-encoded for transition-rich signaling.
6. Each physical bit is mapped to FSK tones:
    - `0 -> baseFrequencyHz`
    - `1 -> baseFrequencyHz + separationHz`
7. Tones are emitted with `OscillatorNode` and shaped with a chime-like gain envelope.

### Receive pipeline

1. Microphone audio is captured via `getUserMedia`.
2. Symbol sampling runs against the audio clock (not wall-clock timers).
3. Goertzel computes tone energy for the configured frequency pair.
4. Physical bits are Manchester-decoded, then UART-decoded into bytes.
5. Preamble/sync/length are validated and CRC-8 is checked.
6. Valid payload chunks stream into terminal output.
7. If enabled, `@ENC:` lines are auto-decrypted before display.

### Calibration

Calibration measures ambient energy and updates detection thresholds to reduce false positives in noisy spaces.

## Current Defaults

- Mode: audible chime (stealth off)
- Baud rate: `80ms`
- Base frequency: `2000 Hz`
- Separation: `500 Hz`
- Amplitude: `0.4`
- Detector FFT size: `1024`
- Detection window: trailing `256` samples

These defaults are chosen for practical phone/laptop interoperability.

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

### Practical start settings

If you are testing phone receiver + laptop sender:

- Keep **Stealth Mode OFF**
- Keep base near `2000 Hz` and separation near `500 Hz`
- Keep volume around `40–70%` (avoid clipping)
- Keep devices within `10–30 cm` for initial tests
- Start listening first, then transmit

## Troubleshooting

- **No decode output**
   - Confirm **Stealth Mode is off** (ultrasonic is less reliable on many devices).
   - Increase volume and reduce distance between devices.
   - Increase baud duration (e.g., `100–140ms`) for difficult environments.
   - Run calibration before transmission.
- **Frequent decode errors**
   - Disable OS/audio enhancements where possible.
   - Reduce background noise and avoid speaker clipping.
   - Lower base frequency toward `1200–1800 Hz` if your speaker is weak.
- **CRC warning shown on receive**
   - Signal was detected but packet integrity failed.
   - Reduce distance/noise or increase baud duration and retry.
- **Encrypted output not readable**
   - Confirm both sides use the same passphrase.
   - Ensure payload lines are `@ENC:<base64>` framed.

## Roadmap

- Clock recovery improvements for tougher acoustic environments
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
