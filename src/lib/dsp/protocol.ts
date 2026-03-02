export type FrequencyProfile = {
  zeroHz: number;
  oneHz: number;
};

export const MIN_BAUD_MS: number = 10;
export const MAX_BAUD_MS: number = 200;
export const MIN_BASE_FREQUENCY_HZ: number = 16_000;
export const MAX_BASE_FREQUENCY_HZ: number = 20_000;
export const ULTRASONIC_MIN_HZ: number = 18_500;

export const PRIMARY_PROFILE: FrequencyProfile = {
  zeroHz: 18_500,
  oneHz: 19_000,
};

export const FALLBACK_PROFILE: FrequencyProfile = {
  zeroHz: 17_200,
  oneHz: 17_700,
};

export const FREQUENCY_PROFILES: FrequencyProfile[] = [PRIMARY_PROFILE, FALLBACK_PROFILE];

export const SYMBOL_DURATION_MS: number = 50;
export const RAMP_DURATION_MS: number = 10;
export const SYMBOL_DURATION_S: number = SYMBOL_DURATION_MS / 1000;
export const RAMP_DURATION_S: number = RAMP_DURATION_MS / 1000;

export const START_BIT = 0 as const;
export const STOP_BIT = 1 as const;
export const BYTE_SIZE: number = 8;

export const DEFAULT_FFT_SIZE: number = 2048;

export function resolveFrequencyProfile(baseFrequencyHz: number, separationHz: number): FrequencyProfile {
  return {
    zeroHz: baseFrequencyHz,
    oneHz: baseFrequencyHz + separationHz,
  };
}

export function clampBaseFrequency(baseFrequencyHz: number, stealthMode: boolean): number {
  const minAllowed: number = stealthMode ? ULTRASONIC_MIN_HZ : MIN_BASE_FREQUENCY_HZ;
  return Math.max(minAllowed, Math.min(MAX_BASE_FREQUENCY_HZ, baseFrequencyHz));
}

export function binForFrequency(frequencyHz: number, sampleRate: number, fftSize: number): number {
  return Math.round((frequencyHz * fftSize) / sampleRate);
}