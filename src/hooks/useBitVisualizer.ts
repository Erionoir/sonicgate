"use client";

import { useCallback, useState } from "react";

const MAX_BITS: number = 96;

export function useBitVisualizer(): {
  bitStream: number[];
  pushBit: (bit: number) => void;
  resetBits: () => void;
} {
  const [bitStream, setBitStream] = useState<number[]>([]);

  const pushBit = useCallback((bit: number): void => {
    setBitStream((previous: number[]) => {
      const next: number[] = [...previous, bit];
      return next.slice(Math.max(0, next.length - MAX_BITS));
    });
  }, []);

  const resetBits = useCallback((): void => {
    setBitStream([]);
  }, []);

  return { bitStream, pushBit, resetBits };
}
