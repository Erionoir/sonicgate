"use client";

import { clampBaseFrequency, MAX_BAUD_MS, MAX_BASE_FREQUENCY_HZ, MIN_BAUD_MS, MIN_BASE_FREQUENCY_HZ, ULTRASONIC_MIN_HZ } from "@/lib/dsp/protocol";
import { ModemConfig } from "@/types/modem";

type SignalSettingsProps = {
  config: ModemConfig;
  onChange: (next: Partial<ModemConfig>) => void;
};

export function SignalSettings({ config, onChange }: SignalSettingsProps): React.JSX.Element {
  const minBase: number = config.stealthMode ? ULTRASONIC_MIN_HZ : MIN_BASE_FREQUENCY_HZ;

  return (
    <section className="rounded-lg border border-zinc-700 bg-zinc-900/80 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Signal Settings</h3>

      <div className="space-y-3 text-xs">
        <label className="block">
          <span className="mb-1 block text-zinc-400">Baud Rate (ms): {config.baudRateMs}</span>
          <input
            type="range"
            min={MIN_BAUD_MS}
            max={MAX_BAUD_MS}
            value={config.baudRateMs}
            onChange={(event) => onChange({ baudRateMs: Number(event.target.value) })}
            className="w-full"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-zinc-400">Base Frequency (Hz): {config.baseFrequencyHz}</span>
          <input
            type="range"
            min={minBase}
            max={MAX_BASE_FREQUENCY_HZ}
            value={config.baseFrequencyHz}
            onChange={(event) =>
              onChange({
                baseFrequencyHz: clampBaseFrequency(Number(event.target.value), config.stealthMode),
              })
            }
            className="w-full"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-zinc-400">Volume: {Math.round(config.amplitude * 100)}%</span>
          <input
            type="range"
            min={5}
            max={80}
            value={Math.round(config.amplitude * 100)}
            onChange={(event) => onChange({ amplitude: Number(event.target.value) / 100 })}
            className="w-full"
          />
        </label>

        <label className="inline-flex items-center gap-2 text-zinc-300">
          <input
            type="checkbox"
            checked={config.stealthMode}
            onChange={(event) => {
              const stealthMode: boolean = event.target.checked;
              onChange({
                stealthMode,
                baseFrequencyHz: clampBaseFrequency(config.baseFrequencyHz, stealthMode),
              });
            }}
          />
          Stealth Mode (Ultrasonic)
        </label>
      </div>
    </section>
  );
}
