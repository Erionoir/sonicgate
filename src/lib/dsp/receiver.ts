import { decodeBytesToMessage } from "@/lib/dsp/encode";
import { FramedBitDecoder } from "@/lib/dsp/decoder";
import { ToneDetector } from "@/lib/dsp/detector";
import { resolveFrequencyProfile } from "@/lib/dsp/protocol";
import { ModemConfig, ToneDecision } from "@/types/modem";

export type ReceiverEvents = {
  onByte?: (value: number) => void;
  onMessageChunk?: (chunk: string) => void;
  onBit?: (decision: ToneDecision) => void;
  onError?: (error: Error) => void;
};

export class SonicReceiver {
  private stream: MediaStream | null;

  private sourceNode: MediaStreamAudioSourceNode | null;

  private analyser: AnalyserNode | null;

  private detector: ToneDetector | null;

  private decoder: FramedBitDecoder;

  private rafId: number | null;

  private nextSymbolTime: number;

  private config: ModemConfig;

  private readonly receivedBytes: number[];

  private readonly events: ReceiverEvents;

  constructor(events?: ReceiverEvents) {
    this.stream = null;
    this.sourceNode = null;
    this.analyser = null;
    this.detector = null;
    this.decoder = new FramedBitDecoder();
    this.rafId = null;
    this.nextSymbolTime = 0;
    this.config = {
      baudRateMs: 50,
      baseFrequencyHz: 18_500,
      separationHz: 500,
      amplitude: 0.2,
      stealthMode: true,
    };
    this.receivedBytes = [];
    this.events = events ?? {};
  }

  public async start(context: AudioContext, config: ModemConfig): Promise<void> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia is not supported in this browser.");
      }

      if (context.state === "suspended") {
        await context.resume();
      }

      this.config = config;

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      });

      this.sourceNode = context.createMediaStreamSource(this.stream);
      this.analyser = context.createAnalyser();
      this.sourceNode.connect(this.analyser);

      this.detector = new ToneDetector(
        this.analyser,
        resolveFrequencyProfile(config.baseFrequencyHz, config.separationHz),
      );

      this.nextSymbolTime = context.currentTime + this.config.baudRateMs / 1000;
      this.runClock(context);
    } catch (error: unknown) {
      this.events.onError?.(error instanceof Error ? error : new Error("Receiver start failed."));
      throw error;
    }
  }

  public async calibrate(durationMs: number): Promise<number> {
    if (this.detector === null) {
      throw new Error("Receiver must be listening before calibration.");
    }

    return this.detector.calibrate(durationMs);
  }

  public getAnalyserNode(): AnalyserNode | null {
    return this.analyser;
  }

  public stop(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    this.sourceNode?.disconnect();
    this.analyser?.disconnect();

    this.stream = null;
    this.sourceNode = null;
    this.analyser = null;
    this.detector = null;
    this.decoder.reset();
  }

  public clear(): void {
    this.receivedBytes.length = 0;
  }

  public getMessage(): string {
    return decodeBytesToMessage(this.receivedBytes);
  }

  private runClock(context: AudioContext): void {
    const symbolDurationS: number = this.config.baudRateMs / 1000;

    const tick = (): void => {
      if (this.detector === null) {
        return;
      }

      while (context.currentTime >= this.nextSymbolTime) {
        const decision: ToneDecision = this.detector.detectBit();
        this.events.onBit?.(decision);

        const decodedByte: number | null = this.decoder.inputBit(decision.bit);

        if (decodedByte !== null) {
          this.receivedBytes.push(decodedByte);
          this.events.onByte?.(decodedByte);
          this.events.onMessageChunk?.(decodeBytesToMessage([decodedByte]));
        }

        this.nextSymbolTime += symbolDurationS;
      }

      this.rafId = window.requestAnimationFrame(tick);
    };

    this.rafId = window.requestAnimationFrame(tick);
  }
}