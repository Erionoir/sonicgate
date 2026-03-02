import { encodeMessageToBits } from "@/lib/dsp/encode";
import { FrequencyProfile, resolveFrequencyProfile } from "@/lib/dsp/protocol";
import { ModemConfig } from "@/types/modem";

export type TransmitOptions = {
  onBitScheduled?: (bit: number, bitIndex: number) => void;
};

export class SonicTransmitter {
  public async sendMessage(
    context: AudioContext,
    message: string,
    config: ModemConfig,
    options?: TransmitOptions,
  ): Promise<void> {
    const bits: number[] = encodeMessageToBits(message, config.protocolMode);
    await this.sendBits(context, bits, config, options);
  }

  public async sendBits(
    context: AudioContext,
    bits: number[],
    config: ModemConfig,
    options?: TransmitOptions,
  ): Promise<void> {
    const symbolDurationS: number = config.baudRateMs / 2000;
    const amplitude: number = config.amplitude;
    const profile: FrequencyProfile = resolveFrequencyProfile(config.baseFrequencyHz, config.separationHz);

    if (context.state === "suspended") {
      await context.resume();
    }

    let startTime: number = context.currentTime + 0.06;
    const firstStartTime: number = startTime;
    const finalTime: number = startTime + bits.length * symbolDurationS;
    const chimeWave: PeriodicWave = context.createPeriodicWave(
      new Float32Array([0, 1, 0.5, 0.2]),
      new Float32Array([0, 0, 0, 0]),
    );
    const attackS: number = Math.min(0.004, symbolDurationS * 0.25);
    const releaseStart: number = symbolDurationS * 0.75;
    const sustainLevel: number = amplitude * 0.65;

    bits.forEach((bit: number, bitIndex: number) => {
      const frequencyHz: number = bit === 0 ? profile.zeroHz : profile.oneHz;

      const oscillator: OscillatorNode = context.createOscillator();
      oscillator.setPeriodicWave(chimeWave);
      oscillator.frequency.setValueAtTime(frequencyHz, startTime);

      const gainNode: GainNode = context.createGain();
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(amplitude, startTime + attackS);
      gainNode.gain.linearRampToValueAtTime(sustainLevel, startTime + releaseStart);
      gainNode.gain.linearRampToValueAtTime(0, startTime + symbolDurationS);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + symbolDurationS + 0.01);

      options?.onBitScheduled?.(bit, bitIndex);

      startTime += symbolDurationS;
    });

    await new Promise<void>((resolve: () => void) => {
      const tick = (): void => {
        const elapsed: number = context.currentTime - firstStartTime;
        if (elapsed >= bits.length * symbolDurationS || context.currentTime >= finalTime) {
          resolve();
          return;
        }
        window.requestAnimationFrame(tick);
      };

      tick();
    });
  }
}