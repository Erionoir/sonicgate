import { goertzelEnergy } from "@/lib/dsp/goertzel";
import {
  ABSOLUTE_ENERGY_FLOOR,
  DEFAULT_FFT_SIZE,
  DETECTION_WINDOW_SAMPLES,
  FrequencyProfile,
} from "@/lib/dsp/protocol";
import { ToneDecision } from "@/types/modem";

export class ToneDetector {
  private readonly analyser: AnalyserNode;

  private readonly sampleBuffer: Float32Array<ArrayBuffer>;

  private noiseFloor: number;

  private thresholdRatio: number;

  private profile: FrequencyProfile;

  private unreliableStreak: number;

  constructor(analyser: AnalyserNode, profile: FrequencyProfile) {
    this.analyser = analyser;
    this.profile = profile;
    this.analyser.fftSize = DEFAULT_FFT_SIZE;
    this.analyser.smoothingTimeConstant = 0;
    this.sampleBuffer = new Float32Array<ArrayBuffer>(new ArrayBuffer(this.analyser.fftSize * 4));
    this.noiseFloor = 0.0005;
    this.thresholdRatio = 1.35;
    this.unreliableStreak = 0;
  }

  public setProfile(profile: FrequencyProfile): void {
    this.profile = profile;
  }

  public setThresholdRatio(ratio: number): void {
    this.thresholdRatio = Math.max(1.05, ratio);
  }

  public getThresholdRatio(): number {
    return this.thresholdRatio;
  }

  public getNoiseFloor(): number {
    return this.noiseFloor;
  }

  public async calibrate(durationMs: number): Promise<number> {
    const startedAt: number = this.analyser.context.currentTime;
    const samples: number[] = [];

    await new Promise<void>((resolve: () => void) => {
      const frame = (): void => {
        this.analyser.getFloatTimeDomainData(this.sampleBuffer);
        samples.push(this.averageTargetEnergy(this.sampleBuffer));

        const elapsedMs: number = (this.analyser.context.currentTime - startedAt) * 1000;
        if (elapsedMs >= durationMs) {
          resolve();
          return;
        }

        window.requestAnimationFrame(frame);
      };

      frame();
    });

    const average: number = samples.length === 0 ? this.noiseFloor : samples.reduce((a, b) => a + b, 0) / samples.length;
    this.noiseFloor = Math.max(average, 0.000001);
    this.thresholdRatio = 1.4;
    return this.noiseFloor;
  }

  public detectBit(): ToneDecision {
    this.analyser.getFloatTimeDomainData(this.sampleBuffer);
    const detectionSlice: Float32Array<ArrayBuffer> = this.sampleBuffer.subarray(
      Math.max(0, this.sampleBuffer.length - DETECTION_WINDOW_SAMPLES),
    );

    const zeroEnergy: number = goertzelEnergy(
      detectionSlice,
      this.profile.zeroHz,
      this.analyser.context.sampleRate,
    );
    const oneEnergy: number = goertzelEnergy(
      detectionSlice,
      this.profile.oneHz,
      this.analyser.context.sampleRate,
    );

    const stronger: number = Math.max(zeroEnergy, oneEnergy);
    const weaker: number = Math.min(zeroEnergy, oneEnergy);
    const ratio: number = stronger / Math.max(weaker, 0.000001);
    const averageEnergy: number = (zeroEnergy + oneEnergy) / 2;
    const reliable: boolean =
      ratio >= this.thresholdRatio &&
      stronger > this.noiseFloor * 1.2 &&
      stronger > ABSOLUTE_ENERGY_FLOOR;

    if (!reliable) {
      this.unreliableStreak += 1;
      const alpha: number = this.unreliableStreak > 80 ? 0.2 : 0.1;
      this.noiseFloor = this.noiseFloor * (1 - alpha) + averageEnergy * alpha;
    } else {
      this.unreliableStreak = 0;
    }

    const confidence: number = stronger / Math.max(this.noiseFloor, 0.000001);

    if (!reliable) {
      return {
        bit: null,
        confidence,
        profile: this.profile,
        zeroEnergy,
        oneEnergy,
      };
    }

    return {
      bit: oneEnergy > zeroEnergy ? 1 : 0,
      confidence,
      profile: this.profile,
      zeroEnergy,
      oneEnergy,
    };
  }

  private averageTargetEnergy(samples: Float32Array<ArrayBuffer>): number {
    const detectionSlice: Float32Array<ArrayBuffer> = samples.subarray(
      Math.max(0, samples.length - DETECTION_WINDOW_SAMPLES),
    );
    const zeroEnergy: number = goertzelEnergy(detectionSlice, this.profile.zeroHz, this.analyser.context.sampleRate);
    const oneEnergy: number = goertzelEnergy(detectionSlice, this.profile.oneHz, this.analyser.context.sampleRate);
    return (zeroEnergy + oneEnergy) / 2;
  }
}