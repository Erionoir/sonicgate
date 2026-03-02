"use client";

import { useRef } from "react";
import { useSpectrogram } from "@/hooks/useSpectrogram";

type SpectrogramProps = {
  analyser: AnalyserNode | null;
  isActive: boolean;
};

export function Spectrogram({ analyser, isActive }: SpectrogramProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useSpectrogram({ analyser, canvasRef, isActive });

  return (
    <section className="rounded-lg border border-cyan-500/40 bg-zinc-900/80 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-cyan-400">Live Spectrogram</h3>
      <canvas ref={canvasRef} className="h-48 w-full rounded border border-zinc-700 bg-zinc-950" />
    </section>
  );
}
