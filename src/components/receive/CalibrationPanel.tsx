"use client";

type CalibrationPanelProps = {
  threshold: number;
  isListening: boolean;
  onCalibrate: () => Promise<void>;
};

export function CalibrationPanel({ threshold, isListening, onCalibrate }: CalibrationPanelProps): React.JSX.Element {
  return (
    <section className="rounded-lg border border-zinc-700 bg-zinc-900/80 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Calibration Mode</h3>
      <p className="mb-3 text-xs text-zinc-500">Ambient noise floor: {threshold.toExponential(2)}</p>
      <button
        type="button"
        disabled={!isListening}
        onClick={() => void onCalibrate()}
        className="rounded-md border border-cyan-500 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-40"
      >
        Measure Noise Floor
      </button>
    </section>
  );
}
