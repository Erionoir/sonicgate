"use client";

import { useState } from "react";
import { CalibrationPanel } from "@/components/receive/CalibrationPanel";
import { EncryptionToggle } from "@/components/transmit/EncryptionToggle";
import { Spectrogram } from "@/components/receive/Spectrogram";
import { TerminalFeed } from "@/components/receive/TerminalFeed";
import { useAudioModem } from "@/context/ModemContext";
import { useReceiver } from "@/hooks/useReceiver";

function detectIOSDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent: string = navigator.userAgent;
  const platform: string = navigator.platform;
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function ListenPanel(): React.JSX.Element {
  const [isIOSDevice] = useState<boolean>(() => detectIOSDevice());
  const [showIOSWarning, setShowIOSWarning] = useState(false);
  const [dismissedIOSWarning, setDismissedIOSWarning] = useState(false);
  const { modemConfig, setModemConfig } = useAudioModem();

  const {
    isListening,
    terminal,
    decryptStatus,
    crcError,
    status,
    noiseThreshold,
    confidence,
    analyserNode,
    encryption,
    setEncryption,
    start,
    stop,
    clear,
    calibrate,
  } = useReceiver();

  const handleStartListening = (): void => {
    if (isIOSDevice && !dismissedIOSWarning) {
      setShowIOSWarning(true);
    }
    void start();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-lg border border-cyan-500/40 bg-zinc-900/80 p-4 md:col-span-2">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-400">/receive</h2>

        <div className="flex flex-wrap items-center gap-2">
          {!isListening ? (
            <button
              type="button"
              onClick={handleStartListening}
              className="rounded-md border border-cyan-500 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-300 hover:bg-cyan-500/10"
            >
              Start Listen
            </button>
          ) : (
            <button
              type="button"
              onClick={stop}
              className="rounded-md border border-cyan-500 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-300 hover:bg-cyan-500/10"
            >
              Stop
            </button>
          )}

          <button
            type="button"
            onClick={clear}
            className="rounded-md border border-zinc-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-300 hover:bg-zinc-700/30"
          >
            Clear Terminal
          </button>

          <span className="ml-auto text-xs text-zinc-400">
            {status} · confidence {confidence.toFixed(2)}
          </span>
        </div>

        {showIOSWarning ? (
          <div className="mt-3 flex items-start justify-between gap-3 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <p>Audio quality may vary on iOS. System noise suppression cannot be fully disabled.</p>
            <button
              type="button"
              onClick={() => {
                setShowIOSWarning(false);
                setDismissedIOSWarning(true);
              }}
              className="rounded border border-amber-400/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200 hover:bg-amber-400/10"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {crcError ? (
          <div className="mt-3 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Message received but CRC check failed — data may be corrupted.
          </div>
        ) : null}
      </section>

      <CalibrationPanel threshold={noiseThreshold} isListening={isListening} onCalibrate={calibrate} />
      <div className="space-y-2">
        <EncryptionToggle encryption={encryption} onChange={setEncryption} />
        <label className="block text-xs">
          <span className="mb-1 block text-zinc-500">Protocol Compatibility</span>
          <select
            value={modemConfig.protocolMode}
            onChange={(event) =>
              setModemConfig({ protocolMode: event.target.value as typeof modemConfig.protocolMode })
            }
            className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-200"
          >
            <option value="enhanced">Enhanced (recommended)</option>
            <option value="legacy">Legacy (older builds)</option>
          </select>
        </label>
        <p className="text-xs text-zinc-500">
          Decrypt pipeline: {decryptStatus === "idle" ? "ready" : decryptStatus}
        </p>
      </div>
      <div className="md:col-span-2">
        <Spectrogram analyser={analyserNode} isActive={isListening} />
      </div>
      <div className="md:col-span-2">
        <TerminalFeed text={terminal} />
      </div>
    </div>
  );
}
