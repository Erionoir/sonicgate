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

    const frequencyData: Uint8Array<ArrayBuffer> = new Uint8Array<ArrayBuffer>(
      new ArrayBuffer(analyser.frequencyBinCount),
    );
    let frameId: number = 0;
    let resizeObserver: ResizeObserver | null = null;

    const syncCanvasSize = (): void => {
      const displayWidth: number = canvas.clientWidth;
      const displayHeight: number = canvas.clientHeight;

      if (displayWidth <= 0 || displayHeight <= 0) {
        return;
      }

      const pixelRatio: number = Math.max(1, window.devicePixelRatio || 1);
      const nextWidth: number = Math.floor(displayWidth * pixelRatio);
      const nextHeight: number = Math.floor(displayHeight * pixelRatio);

      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
        context.clearRect(0, 0, nextWidth, nextHeight);
      }
    };

    syncCanvasSize();
    resizeObserver = new ResizeObserver(syncCanvasSize);
    resizeObserver.observe(canvas);

    const draw = (): void => {
      analyser.getByteFrequencyData(frequencyData);
      const width: number = canvas.width;
      const height: number = canvas.height;

      if (width < 2 || height < 1) {
        frameId = window.requestAnimationFrame(draw);
        return;
      }

      const previousFrame: ImageData = context.getImageData(1, 0, width - 1, height);
      context.putImageData(previousFrame, 0, 0);
      context.clearRect(width - 1, 0, 1, height);

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
      context.clearRect(0, 0, canvas.width, canvas.height);
      resizeObserver?.disconnect();
    };
  }, [analyser, canvasRef, isActive]);
}
