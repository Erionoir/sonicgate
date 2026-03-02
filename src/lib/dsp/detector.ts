import { goertzelEnergy } from "@/lib/dsp/goertzel";
import { DEFAULT_FFT_SIZE, FrequencyProfile } from "@/lib/dsp/protocol";
import { ToneDecision } from "@/types/modem";

export class ToneDetector {
  private readonly analyser: AnalyserNode;

  private readonly sampleBuffer: Float32Array<ArrayBuffer>;

  private noiseFloor: number;

  private thresholdRatio: number;

  private profile: FrequencyProfile;

  constructor(analyser: AnalyserNode, profile: FrequencyProfile) {
    this.analyser = analyser;
    this.profile = profile;
    this.analyser.fftSize = DEFAULT_FFT_SIZE;
    this.analyser.smoothingTimeConstant = 0;
    this.sampleBuffer = new Float32Array<ArrayBuffer>(new ArrayBuffer(this.analyser.fftSize * 4));
    this.noiseFloor = 0.0005;
    this.thresholdRatio = 1.6;
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
    this.thresholdRatio = 1.8;
    return this.noiseFloor;
  }

  public detectBit(): ToneDecision {
    this.analyser.getFloatTimeDomainData(this.sampleBuffer);

    const zeroEnergy: number = goertzelEnergy(
      this.sampleBuffer,
      this.profile.zeroHz,
      this.analyser.context.sampleRate,
    );
    const oneEnergy: number = goertzelEnergy(
      this.sampleBuffer,
      this.profile.oneHz,
      this.analyser.context.sampleRate,
    );

    const averageEnergy: number = (zeroEnergy + oneEnergy) / 2;
    this.noiseFloor = this.noiseFloor * 0.94 + averageEnergy * 0.06;

    const stronger: number = Math.max(zeroEnergy, oneEnergy);
    const weaker: number = Math.min(zeroEnergy, oneEnergy);
    const ratio: number = stronger / Math.max(weaker, 0.000001);
    const confidence: number = stronger / Math.max(this.noiseFloor, 0.000001);
    const reliable: boolean = ratio >= this.thresholdRatio && stronger > this.noiseFloor * 1.2;

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
    const zeroEnergy: number = goertzelEnergy(samples, this.profile.zeroHz, this.analyser.context.sampleRate);
    const oneEnergy: number = goertzelEnergy(samples, this.profile.oneHz, this.analyser.context.sampleRate);
    return (zeroEnergy + oneEnergy) / 2;
  }
}