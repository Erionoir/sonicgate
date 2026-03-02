import { bitsToByteLsbFirst } from "@/lib/dsp/encode";
import { BYTE_SIZE } from "@/lib/dsp/protocol";

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