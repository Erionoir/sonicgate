export type FrequencyProfile = {
  zeroHz: number;
  oneHz: number;
};

export type ProtocolMode = "legacy" | "enhanced";

export const MIN_BAUD_MS: number = 10;
export const MAX_BAUD_MS: number = 200;
export const MIN_BASE_FREQUENCY_HZ: number = 300;
export const MAX_BASE_FREQUENCY_HZ: number = 20_000;
export const ULTRASONIC_MIN_HZ: number = 18_500;

export const CHIME_BASE_HZ: number = 2_000;
export const CHIME_SEPARATION_HZ: number = 500;

export const PRIMARY_PROFILE: FrequencyProfile = {
  zeroHz: CHIME_BASE_HZ,
  oneHz: CHIME_BASE_HZ + CHIME_SEPARATION_HZ,
};

export const FALLBACK_PROFILE: FrequencyProfile = {
  zeroHz: 1_400,
  oneHz: 1_900,
};

export const FREQUENCY_PROFILES: FrequencyProfile[] = [PRIMARY_PROFILE, FALLBACK_PROFILE];

export const SYMBOL_DURATION_MS: number = 80;
export const RAMP_DURATION_MS: number = 5;
export const SYMBOL_DURATION_S: number = SYMBOL_DURATION_MS / 1000;
export const RAMP_DURATION_S: number = RAMP_DURATION_MS / 1000;

export const START_BIT = 0 as const;
export const STOP_BIT = 1 as const;
export const BYTE_SIZE: number = 8;

export const LEGACY_PREAMBLE_BYTES: number[] = [0xaa, 0x55];
export const ENHANCED_PREAMBLE_BYTES: number[] = [0xaa, 0x55, 0xaa, 0x55];
export const PREAMBLE_SYNC_WORD: number = 0xf0;
export const ABSOLUTE_ENERGY_FLOOR: number = 0.00001;
export const CRC8_POLY: number = 0x31;
export const CRC8_INIT: number = 0x00;
export const CRC16_POLY: number = 0x1021;
export const CRC16_INIT: number = 0xffff;

export const DEFAULT_FFT_SIZE: number = 1024;
export const DETECTION_WINDOW_SAMPLES: number = 256;

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