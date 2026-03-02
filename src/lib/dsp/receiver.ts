import { crc8, crc16, decodeBytesToMessage } from "@/lib/dsp/encode";
import { FramedBitDecoder, ManchesterDecoder } from "@/lib/dsp/decoder";
import { ToneDetector } from "@/lib/dsp/detector";
import {
  CHIME_BASE_HZ,
  CHIME_SEPARATION_HZ,
  ENHANCED_PREAMBLE_BYTES,
  LEGACY_PREAMBLE_BYTES,
  PREAMBLE_SYNC_WORD,
  resolveFrequencyProfile,
} from "@/lib/dsp/protocol";
import { ModemConfig, ToneDecision } from "@/types/modem";

export type ReceiverEvents = {
  onByte?: (value: number) => void;
  onMessageChunk?: (chunk: string) => void;
  onPacket?: (message: string) => void;
  onCrcError?: () => void;
  onBit?: (decision: ToneDecision) => void;
  onError?: (error: Error) => void;
};

export class SonicReceiver {
  private stream: MediaStream | null;

  private sourceNode: MediaStreamAudioSourceNode | null;

  private analyser: AnalyserNode | null;

  private detector: ToneDetector | null;

  private decoder: FramedBitDecoder;

  private manchesterDecoder: ManchesterDecoder;

  private rafId: number | null;

  private nextSymbolTime: number;

  private readonly symbolDecisionSamples: number;

  private config: ModemConfig;

  private readonly receivedBytes: number[];

  private readonly syncBytes: number[];

  private lockedToPacket: boolean;

  private expectedPayloadLength: number | null;

  private readonly packetPayloadBytes: number[];

  private readonly events: ReceiverEvents;

  constructor(events?: ReceiverEvents) {
    this.stream = null;
    this.sourceNode = null;
    this.analyser = null;
    this.detector = null;
    this.decoder = new FramedBitDecoder();
    this.manchesterDecoder = new ManchesterDecoder();
    this.rafId = null;
    this.nextSymbolTime = 0;
    this.symbolDecisionSamples = 3;
    this.config = {
      baudRateMs: 80,
      baseFrequencyHz: CHIME_BASE_HZ,
      separationHz: CHIME_SEPARATION_HZ,
      amplitude: 0.4,
      stealthMode: false,
      protocolMode: "enhanced",
    };
    this.receivedBytes = [];
    this.syncBytes = [];
    this.lockedToPacket = false;
    this.expectedPayloadLength = null;
    this.packetPayloadBytes = [];
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

      this.resetRuntimeState();
      this.nextSymbolTime = context.currentTime + this.config.baudRateMs / 2000;
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
    this.resetRuntimeState();
  }

  public clear(): void {
    this.receivedBytes.length = 0;
    this.resetRuntimeState();
  }

  public getMessage(): string {
    return decodeBytesToMessage(this.receivedBytes);
  }

  private runClock(context: AudioContext): void {
    const symbolDurationS: number = this.config.baudRateMs / 2000;

    const tick = (): void => {
      if (this.detector === null) {
        return;
      }

      while (context.currentTime >= this.nextSymbolTime) {
        const decision: ToneDecision = this.detectBitWithMajorityVote();
        this.events.onBit?.(decision);

        const logicalBit: 0 | 1 | null = this.manchesterDecoder.inputBit(decision.bit);
        const decodedByte: number | null = this.decoder.inputBit(logicalBit);

        if (decodedByte !== null) {
          this.processDecodedByte(decodedByte);
        }

        this.nextSymbolTime += symbolDurationS;
      }

      this.rafId = window.requestAnimationFrame(tick);
    };

    this.rafId = window.requestAnimationFrame(tick);
  }

  private detectBitWithMajorityVote(): ToneDecision {
    if (this.detector === null) {
      return {
        bit: null,
        confidence: 0,
        profile: resolveFrequencyProfile(this.config.baseFrequencyHz, this.config.separationHz),
        zeroEnergy: 0,
        oneEnergy: 0,
      };
    }

    const decisions: ToneDecision[] = [];
    for (let index: number = 0; index < this.symbolDecisionSamples; index += 1) {
      decisions.push(this.detector.detectBit());
    }

    const onesCount: number = decisions.filter((decision: ToneDecision) => decision.bit === 1).length;
    const zerosCount: number = decisions.filter((decision: ToneDecision) => decision.bit === 0).length;
    const resolvedBit: 0 | 1 | null =
      onesCount > zerosCount ? 1 : zerosCount > onesCount ? 0 : null;

    const averagedConfidence: number =
      decisions.reduce((sum: number, decision: ToneDecision) => sum + decision.confidence, 0) /
      decisions.length;
    const averagedZeroEnergy: number =
      decisions.reduce((sum: number, decision: ToneDecision) => sum + decision.zeroEnergy, 0) /
      decisions.length;
    const averagedOneEnergy: number =
      decisions.reduce((sum: number, decision: ToneDecision) => sum + decision.oneEnergy, 0) /
      decisions.length;

    return {
      bit: resolvedBit,
      confidence: averagedConfidence,
      profile: decisions[0]?.profile ?? resolveFrequencyProfile(this.config.baseFrequencyHz, this.config.separationHz),
      zeroEnergy: averagedZeroEnergy,
      oneEnergy: averagedOneEnergy,
    };
  }

  private processDecodedByte(decodedByte: number): void {
    this.events.onByte?.(decodedByte);

    if (!this.lockedToPacket) {
      this.syncBytes.push(decodedByte);
      const signatureLength: number = this.getPreambleBytes().length + 1;
      if (this.syncBytes.length > signatureLength) {
        this.syncBytes.shift();
      }

      if (this.hasPacketSignature()) {
        this.lockedToPacket = true;
        this.expectedPayloadLength = null;
        this.packetPayloadBytes.length = 0;
      }
      return;
    }

    if (this.expectedPayloadLength === null) {
      this.expectedPayloadLength = decodedByte;
      if (this.expectedPayloadLength < 0 || this.expectedPayloadLength > 255) {
        this.resetRuntimeState();
      }
      return;
    }

    this.packetPayloadBytes.push(decodedByte);
    const requiredLength: number = this.expectedPayloadLength + this.getChecksumLength();
    if (this.packetPayloadBytes.length < requiredLength) {
      return;
    }

    const payloadBytes: number[] = this.packetPayloadBytes.slice(0, this.expectedPayloadLength);
    const receivedCrc: number = this.readChecksum(payloadBytes.length);
    const computedCrc: number = this.computeChecksum(payloadBytes);

    if (receivedCrc !== computedCrc) {
      this.events.onCrcError?.();
      this.resetRuntimeState();
      return;
    }

    this.receivedBytes.push(...payloadBytes);
    const packetMessage: string = decodeBytesToMessage(payloadBytes);
    this.events.onPacket?.(packetMessage);
    this.events.onMessageChunk?.(packetMessage);
    this.resetRuntimeState();
  }

  private hasPacketSignature(): boolean {
    const preambleBytes: number[] = this.getPreambleBytes();
    const signatureLength: number = preambleBytes.length + 1;
    if (this.syncBytes.length !== signatureLength) {
      return false;
    }

    for (let index: number = 0; index < preambleBytes.length; index += 1) {
      if ((this.syncBytes[index] ?? -1) !== preambleBytes[index]) {
        return false;
      }
    }

    return (this.syncBytes[preambleBytes.length] ?? -1) === PREAMBLE_SYNC_WORD;
  }

  private getPreambleBytes(): number[] {
    return this.config.protocolMode === "legacy" ? LEGACY_PREAMBLE_BYTES : ENHANCED_PREAMBLE_BYTES;
  }

  private getChecksumLength(): number {
    return this.config.protocolMode === "legacy" ? 1 : 2;
  }

  private readChecksum(payloadLength: number): number {
    if (this.config.protocolMode === "legacy") {
      return this.packetPayloadBytes[payloadLength] ?? 0;
    }

    const receivedCrcHigh: number = this.packetPayloadBytes[payloadLength] ?? 0;
    const receivedCrcLow: number = this.packetPayloadBytes[payloadLength + 1] ?? 0;
    return ((receivedCrcHigh & 0xff) << 8) | (receivedCrcLow & 0xff);
  }

  private computeChecksum(payloadBytes: number[]): number {
    if (this.config.protocolMode === "legacy") {
      return crc8([this.expectedPayloadLength ?? 0, ...payloadBytes]);
    }

    return crc16([this.expectedPayloadLength ?? 0, ...payloadBytes]);
  }

  private resetPacketState(): void {
    this.lockedToPacket = false;
    this.expectedPayloadLength = null;
    this.packetPayloadBytes.length = 0;
    this.syncBytes.length = 0;
  }

  private resetRuntimeState(): void {
    this.decoder.reset();
    this.manchesterDecoder.reset();
    this.resetPacketState();
  }
}