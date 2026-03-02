"use client";

import { useEffect, useRef } from "react";

type TerminalFeedProps = {
  text: string;
};

export function TerminalFeed({ text }: TerminalFeedProps): React.JSX.Element {
  const ref = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (ref.current !== null) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [text]);

  return (
    <section className="rounded-lg border border-cyan-500/40 bg-zinc-900/80 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-cyan-400">Terminal Feed</h3>
      <pre
        ref={ref}
        className="max-h-56 min-h-32 overflow-auto overflow-x-auto whitespace-pre-wrap break-all rounded border border-zinc-700 bg-zinc-950 p-3 text-sm text-cyan-300"
      >
        {text || "Awaiting decoded UART frames..."}
      </pre>
    </section>
  );
}
