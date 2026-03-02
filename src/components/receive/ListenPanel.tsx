"use client";

import { CalibrationPanel } from "@/components/receive/CalibrationPanel";
import { EncryptionToggle } from "@/components/transmit/EncryptionToggle";
import { Spectrogram } from "@/components/receive/Spectrogram";
import { TerminalFeed } from "@/components/receive/TerminalFeed";
import { useReceiver } from "@/hooks/useReceiver";

export function ListenPanel(): React.JSX.Element {
  const {
    isListening,
    terminal,
    decryptStatus,
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

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-lg border border-cyan-500/40 bg-zinc-900/80 p-4 md:col-span-2">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-400">/receive</h2>

        <div className="flex flex-wrap items-center gap-2">
          {!isListening ? (
            <button
              type="button"
              onClick={() => void start()}
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
      </section>

      <CalibrationPanel threshold={noiseThreshold} isListening={isListening} onCalibrate={calibrate} />
      <div className="space-y-2">
        <EncryptionToggle encryption={encryption} onChange={setEncryption} />
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
