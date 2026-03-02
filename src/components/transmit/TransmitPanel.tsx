"use client";

import { BitVisualizer } from "@/components/transmit/BitVisualizer";
import { EncryptionToggle } from "@/components/transmit/EncryptionToggle";
import { SignalSettings } from "@/components/transmit/SignalSettings";
import { useTransmitter } from "@/hooks/useTransmitter";

export function TransmitPanel(): React.JSX.Element {
  const {
    message,
    setMessage,
    isSending,
    status,
    modemConfig,
    setModemConfig,
    encryption,
    setEncryption,
    bitStream,
    send,
  } = useTransmitter();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-lg border border-emerald-500/40 bg-zinc-900/80 p-4 md:col-span-2">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-400">/transmit</h2>

        <label htmlFor="tx-message" className="mb-2 block text-xs text-zinc-400">
          Payload
        </label>
        <textarea
          id="tx-message"
          className="h-28 w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 p-3 text-sm text-emerald-300 outline-none focus:border-emerald-500"
          placeholder="Type message..."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-400">{status}</span>
          <button
            type="button"
            disabled={isSending || message.trim().length === 0 || (encryption.enabled && encryption.passphrase.length === 0)}
            onClick={() => void send()}
            className="rounded-md border border-emerald-500 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-300 transition hover:bg-emerald-500/10 disabled:opacity-40"
          >
            {isSending ? "Sending..." : "Transmit"}
          </button>
        </div>
      </section>

      <SignalSettings config={modemConfig} onChange={setModemConfig} />
      <EncryptionToggle encryption={encryption} onChange={setEncryption} />
      <div className="md:col-span-2">
        <BitVisualizer bits={bitStream} />
      </div>
    </div>
  );
}
