import {
  BYTE_SIZE,
  CRC8_INIT,
  CRC8_POLY,
  PREAMBLE_BYTES,
  PREAMBLE_SYNC_WORD,
  START_BIT,
  STOP_BIT,
} from "@/lib/dsp/protocol";

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

export function crc8(input: number[] | Uint8Array): number {
  let crc: number = CRC8_INIT;

  for (let index: number = 0; index < input.length; index += 1) {
    crc ^= input[index] ?? 0;
    for (let bit: number = 0; bit < 8; bit += 1) {
      crc = (crc & 0x80) !== 0 ? ((crc << 1) ^ CRC8_POLY) & 0xff : (crc << 1) & 0xff;
    }
  }

  return crc;
}

export function manchesterEncode(bits: number[]): number[] {
  const encoded: number[] = [];

  bits.forEach((bit: number) => {
    if (bit === 0) {
      encoded.push(0, 1);
      return;
    }

    encoded.push(1, 0);
  });

  return encoded;
}

export function encodeMessageToBits(message: string): number[] {
  const payloadBytes: Uint8Array = stringToUtf8Bytes(message);

  if (payloadBytes.length > 255) {
    throw new Error("Payload too large. Maximum encoded payload size is 255 bytes.");
  }

  const packetBytes: number[] = [
    ...PREAMBLE_BYTES,
    PREAMBLE_SYNC_WORD,
    payloadBytes.length,
    ...Array.from(payloadBytes),
  ];
  const checksum: number = crc8([payloadBytes.length, ...Array.from(payloadBytes)]);
  packetBytes.push(checksum);

  const framedBits: number[] = [];

  packetBytes.forEach((byte: number) => {
    framedBits.push(START_BIT);
    framedBits.push(...byteToBitsLsbFirst(byte));
    framedBits.push(STOP_BIT);
  });

  return manchesterEncode(framedBits);
}

export function decodeBytesToMessage(bytes: number[]): string {
  return utf8BytesToString(Uint8Array.from(bytes));
}