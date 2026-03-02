"use client";

type BitVisualizerProps = {
  bits: number[];
};

export function BitVisualizer({ bits }: BitVisualizerProps): React.JSX.Element {
  return (
    <section className="rounded-lg border border-emerald-500/40 bg-zinc-900/80 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-400">Bit Stream Visualizer</h3>
      <div className="grid min-h-16 grid-cols-12 gap-1">
        {bits.length === 0 ? (
          <p className="col-span-12 text-xs text-zinc-500">No signal playing</p>
        ) : (
          bits.map((bit: number, index: number) => (
            <div
              key={`${index}-${bit}`}
              className={`h-6 rounded border text-center text-[10px] leading-6 ${
                bit === 1
                  ? "border-emerald-500 bg-emerald-500/30 text-emerald-200"
                  : "border-zinc-600 bg-zinc-800 text-zinc-300"
              }`}
            >
              {bit}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
