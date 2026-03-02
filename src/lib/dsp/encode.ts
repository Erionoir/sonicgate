import { BYTE_SIZE, START_BIT, STOP_BIT } from "@/lib/dsp/protocol";

export function stringToUtf8Bytes(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

export function utf8BytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function byteToBitsLsbFirst(value: number): number[] {
  const bits: number[] = [];

  for (let bitIndex: number = 0; bitIndex < BYTE_SIZE; bitIndex += 1) {
    bits.push((value >> bitIndex) & 1);
  }

  return bits;
}

export function bitsToByteLsbFirst(bits: number[]): number {
  let output: number = 0;

  for (let bitIndex: number = 0; bitIndex < BYTE_SIZE; bitIndex += 1) {
    const bit: number = bits[bitIndex] ?? 0;
    output |= (bit & 1) << bitIndex;
  }

  return output;
}

export function encodeMessageToBits(message: string): number[] {
  const bytes: Uint8Array = stringToUtf8Bytes(message);
  const framedBits: number[] = [];

  bytes.forEach((byte: number) => {
    framedBits.push(START_BIT);
    framedBits.push(...byteToBitsLsbFirst(byte));
    framedBits.push(STOP_BIT);
  });

  return framedBits;
}

export function decodeBytesToMessage(bytes: number[]): string {
  return utf8BytesToString(Uint8Array.from(bytes));
}