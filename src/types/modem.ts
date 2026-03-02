import { FrequencyProfile } from "@/lib/dsp/protocol";

export interface ModemConfig {
  baudRateMs: number;
  baseFrequencyHz: number;
  separationHz: number;
  amplitude: number;
  stealthMode: boolean;
}

export interface EncryptionConfig {
  enabled: boolean;
  passphrase: string;
}

export interface AesEncryptResult {
  payload: string;
}

export interface ToneDecision {
  bit: 0 | 1 | null;
  confidence: number;
  profile: FrequencyProfile;
  zeroEnergy: number;
  oneEnergy: number;
}

export interface ModemContextValue {
  audioContext: AudioContext | null;
  modemConfig: ModemConfig;
  setModemConfig: (next: Partial<ModemConfig>) => void;
  ensureReady: () => Promise<AudioContext>;
}

export interface UseTransmitterResult {
  message: string;
  setMessage: (value: string) => void;
  isSending: boolean;
  status: string;
  modemConfig: ModemConfig;
  setModemConfig: (next: Partial<ModemConfig>) => void;
  encryption: EncryptionConfig;
  setEncryption: (next: Partial<EncryptionConfig>) => void;
  bitStream: number[];
  send: () => Promise<void>;
}

export interface UseReceiverResult {
  isListening: boolean;
  rawTerminal: string;
  terminal: string;
  decryptStatus: "idle" | "working" | "error";
  crcError: boolean;
  status: string;
  noiseThreshold: number;
  confidence: number;
  analyserNode: AnalyserNode | null;
  encryption: EncryptionConfig;
  setEncryption: (next: Partial<EncryptionConfig>) => void;
  start: () => Promise<void>;
  stop: () => void;
  clear: () => void;
  calibrate: () => Promise<void>;
}
