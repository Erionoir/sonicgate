"use client";

import { useMemo, useState } from "react";
import { useAudioModem } from "@/context/ModemContext";
import { encryptPayload } from "@/lib/crypto/aes";
import { clampBaseFrequency } from "@/lib/dsp/protocol";
import { SonicTransmitter } from "@/lib/dsp/transmitter";
import { useBitVisualizer } from "@/hooks/useBitVisualizer";
import { EncryptionConfig, UseTransmitterResult } from "@/types/modem";

export function useTransmitter(): UseTransmitterResult {
  const transmitter: SonicTransmitter = useMemo(() => new SonicTransmitter(), []);
  const { modemConfig, setModemConfig, ensureReady } = useAudioModem();
  const { bitStream, pushBit, resetBits } = useBitVisualizer();
  const [message, setMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("Idle");
  const [encryption, setEncryptionState] = useState<EncryptionConfig>({
    enabled: false,
    passphrase: "",
  });

  const setEncryption = (next: Partial<EncryptionConfig>): void => {
    setEncryptionState((previous: EncryptionConfig) => ({ ...previous, ...next }));
  };

  const send = async (): Promise<void> => {
    if (message.trim().length === 0 || isSending) {
      return;
    }

    setIsSending(true);
    setStatus("Transmitting...");
    resetBits();

    try {
      const context: AudioContext = await ensureReady();
      const baseFrequencyHz: number = clampBaseFrequency(modemConfig.baseFrequencyHz, modemConfig.stealthMode);
      if (baseFrequencyHz !== modemConfig.baseFrequencyHz) {
        setModemConfig({ baseFrequencyHz });
      }

      const payloadBody: string = encryption.enabled
        ? `@ENC:${(await encryptPayload(message, encryption.passphrase)).payload}`
        : message;

      await transmitter.sendMessage(context, `${payloadBody}\n`, { ...modemConfig, baseFrequencyHz }, {
        onBitScheduled: (bit: number): void => {
          pushBit(bit);
        },
      });
      setStatus("Transmission complete");
    } catch {
      setStatus("Transmit failed");
    } finally {
      setIsSending(false);
    }
  };

  return {
    message,
    setMessage,
    isSending,
    status,
    modemConfig,
    setModemConfig,
    encryption,
    setEncryption,
    bitStream,
    send,
  };
}