"use client";

import { MutableRefObject, useEffect } from "react";

type UseSpectrogramOptions = {
  analyser: AnalyserNode | null;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  isActive: boolean;
};

export function useSpectrogram({ analyser, canvasRef, isActive }: UseSpectrogramOptions): void {
  useEffect(() => {
    if (!isActive || analyser === null) {
      return;
    }

    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (canvas === null) {
      return;
    }

    const context: CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (context === null) {
      return;
    }

    const width: number = canvas.width;
    const height: number = canvas.height;
    const frequencyData: Uint8Array<ArrayBuffer> = new Uint8Array<ArrayBuffer>(
      new ArrayBuffer(analyser.frequencyBinCount),
    );
    let frameId: number = 0;

    const draw = (): void => {
      analyser.getByteFrequencyData(frequencyData);
      const previousFrame: ImageData = context.getImageData(1, 0, width - 1, height);
      context.putImageData(previousFrame, 0, 0);

      for (let y: number = 0; y < height; y += 1) {
        const ratio: number = y / height;
        const binIndex: number = Math.min(
          frequencyData.length - 1,
          Math.floor((1 - ratio) * frequencyData.length),
        );
        const magnitude: number = frequencyData[binIndex] ?? 0;
        const alpha: number = Math.min(1, magnitude / 220);

        context.fillStyle = `rgba(${40 + magnitude}, ${220 - magnitude * 0.4}, 255, ${alpha})`;
        context.fillRect(width - 1, y, 1, 1);
      }

      frameId = window.requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [analyser, canvasRef, isActive]);
}
