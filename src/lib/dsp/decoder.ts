import { bitsToByteLsbFirst } from "@/lib/dsp/encode";
import { BYTE_SIZE } from "@/lib/dsp/protocol";

export class ManchesterDecoder {
  private readonly physicalBits: number[];

  private invalidPairStreak: number;

  constructor() {
    this.physicalBits = [];
    this.invalidPairStreak = 0;
  }

  public inputBit(bit: 0 | 1 | null): 0 | 1 | null {
    if (bit === null) {
      return null;
    }

    this.physicalBits.push(bit);

    while (this.physicalBits.length >= 2) {
      const first: number = this.physicalBits[0] ?? 0;
      const second: number = this.physicalBits[1] ?? 0;

      if (first === 0 && second === 1) {
        this.invalidPairStreak = 0;
        this.physicalBits.splice(0, 2);
        return 0;
      }

      if (first === 1 && second === 0) {
        this.invalidPairStreak = 0;
        this.physicalBits.splice(0, 2);
        return 1;
      }

      this.invalidPairStreak += 1;
      if (this.invalidPairStreak >= 2) {
        this.reset();
        return null;
      }

      this.physicalBits.shift();
    }

    return null;
  }

  public reset(): void {
    this.physicalBits.length = 0;
    this.invalidPairStreak = 0;
  }
}

enum DecoderState {
  Idle,
  ReadingBits,
  WaitingStop,
}

export class FramedBitDecoder {
  private state: DecoderState;

  private readonly currentBits: number[];

  constructor() {
    this.state = DecoderState.Idle;
    this.currentBits = [];
  }

  public inputBit(bit: 0 | 1 | null): number | null {
    if (bit === null) {
      return null;
    }

    if (this.state === DecoderState.Idle) {
      if (bit === 0) {
        this.currentBits.length = 0;
        this.state = DecoderState.ReadingBits;
      }
      return null;
    }

    if (this.state === DecoderState.ReadingBits) {
      this.currentBits.push(bit);
      if (this.currentBits.length === BYTE_SIZE) {
        this.state = DecoderState.WaitingStop;
      }
      return null;
    }

    if (bit !== 1) {
      this.reset();
      return null;
    }

    const value: number = bitsToByteLsbFirst(this.currentBits);
    this.reset();
    return value;
  }

  public reset(): void {
    this.currentBits.length = 0;
    this.state = DecoderState.Idle;
  }
}