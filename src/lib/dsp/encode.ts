import {
  BYTE_SIZE,
  CRC8_INIT,
  CRC8_POLY,
  CRC16_INIT,
  CRC16_POLY,
  ENHANCED_PREAMBLE_BYTES,
  LEGACY_PREAMBLE_BYTES,
  PREAMBLE_SYNC_WORD,
  ProtocolMode,
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

export function crc16(input: number[] | Uint8Array): number {
  let crc: number = CRC16_INIT;

  for (let index: number = 0; index < input.length; index += 1) {
    crc ^= ((input[index] ?? 0) & 0xff) << 8;
    for (let bit: number = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ CRC16_POLY) & 0xffff : (crc << 1) & 0xffff;
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

export function encodeMessageToBits(message: string, protocolMode: ProtocolMode = "enhanced"): number[] {
  const payloadBytes: Uint8Array = stringToUtf8Bytes(message);

  if (payloadBytes.length > 255) {
    throw new Error("Payload too large. Maximum encoded payload size is 255 bytes.");
  }

  const preambleBytes: number[] = protocolMode === "legacy" ? LEGACY_PREAMBLE_BYTES : ENHANCED_PREAMBLE_BYTES;
  const packetBytes: number[] = [
    ...preambleBytes,
    PREAMBLE_SYNC_WORD,
    payloadBytes.length,
    ...Array.from(payloadBytes),
  ];

  if (protocolMode === "legacy") {
    const checksum: number = crc8([payloadBytes.length, ...Array.from(payloadBytes)]);
    packetBytes.push(checksum);
  } else {
    const checksum: number = crc16([payloadBytes.length, ...Array.from(payloadBytes)]);
    packetBytes.push((checksum >> 8) & 0xff);
    packetBytes.push(checksum & 0xff);
  }

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