"use client";

import { useEffect, useRef, useState } from "react";

type TerminalFeedProps = {
  text: string;
};

export function TerminalFeed({ text }: TerminalFeedProps): React.JSX.Element {
  const ref = useRef<HTMLPreElement | null>(null);
  const [displayedText, setDisplayedText] = useState<string>("");
  const [pendingQueue, setPendingQueue] = useState<string>("");

  useEffect(() => {
    const timeoutId: number = window.setTimeout(() => {
      if (text.length < displayedText.length + pendingQueue.length) {
        setDisplayedText(text);
        setPendingQueue("");
        return;
      }

      const alreadyBuffered: string = displayedText + pendingQueue;
      if (text.startsWith(alreadyBuffered)) {
        const delta: string = text.slice(alreadyBuffered.length);
        if (delta.length > 0) {
          setPendingQueue((previous: string) => previous + delta);
        }
        return;
      }

      setDisplayedText("");
      setPendingQueue(text);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [text, displayedText, pendingQueue]);

  useEffect(() => {
    if (pendingQueue.length === 0) {
      return;
    }

    const intervalId: number = window.setInterval(() => {
      setPendingQueue((queue: string) => {
        if (queue.length === 0) {
          return queue;
        }

        const nextChar: string = queue[0] ?? "";
        setDisplayedText((previous: string) => previous + nextChar);
        return queue.slice(1);
      });
    }, 30);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [pendingQueue]);

  useEffect(() => {
    if (ref.current !== null) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [displayedText, pendingQueue]);

  const renderedText: string = displayedText.length > 0 || pendingQueue.length > 0 ? displayedText : text;
  const showCursor: boolean = pendingQueue.length > 0;

  return (
    <section className="rounded-lg border border-cyan-500/40 bg-zinc-900/80 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-cyan-400">Terminal Feed</h3>
      <pre
        ref={ref}
        className="max-h-56 min-h-32 overflow-auto overflow-x-auto whitespace-pre-wrap break-all rounded border border-zinc-700 bg-zinc-950 p-3 text-sm text-cyan-300"
      >
        {renderedText || "Awaiting decoded UART frames..."}
        {showCursor ? "▌" : ""}
      </pre>
    </section>
  );
}
