"use client";

import { useEffect, useMemo, useState } from "react";
import { useAudioModem } from "@/context/ModemContext";
import { useDecrypt } from "@/hooks/useDecrypt";
import { SonicReceiver } from "@/lib/dsp/receiver";
import { EncryptionConfig, ToneDecision, UseReceiverResult } from "@/types/modem";

export function useReceiver(): UseReceiverResult {
  const { ensureReady, modemConfig } = useAudioModem();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("Idle");
  const [crcError, setCrcError] = useState<boolean>(false);
  const [noiseThreshold, setNoiseThreshold] = useState<number>(0);
  const [confidence, setConfidence] = useState<number>(0);
  const [encryption, setEncryptionState] = useState<EncryptionConfig>({
    enabled: false,
    passphrase: "",
  });
  const { rawTerminal, displayTerminal, decryptStatus, processChunk, clear: clearDecrypt } = useDecrypt(encryption);

  const receiver: SonicReceiver = useMemo(
    () =>
      new SonicReceiver({
        onPacket: (chunk: string) => {
          setCrcError(false);
          processChunk(chunk);
        },
        onCrcError: () => {
          setCrcError(true);
          setStatus("CRC mismatch");
        },
        onBit: (decision: ToneDecision) => {
          setConfidence(decision.confidence);
        },
        onError: () => {
          setStatus("Mic error");
          setIsListening(false);
        },
      }),
    [processChunk],
  );

  const setEncryption = (next: Partial<EncryptionConfig>): void => {
    setEncryptionState((previous: EncryptionConfig) => ({ ...previous, ...next }));
  };

  const start = async (): Promise<void> => {
    if (isListening) {
      return;
    }

    setStatus("Listening...");
    setCrcError(false);
    try {
      const context: AudioContext = await ensureReady();
      await receiver.start(context, modemConfig);
      setIsListening(true);
      setStatus("Listening");
    } catch {
      setStatus("Permission denied or unavailable");
      setIsListening(false);
    }
  };

  const stop = (): void => {
    receiver.stop();
    setIsListening(false);
    setStatus("Stopped");
  };

  const clear = (): void => {
    receiver.clear();
    clearDecrypt();
    setCrcError(false);
  };

  const calibrate = async (): Promise<void> => {
    if (!isListening) {
      return;
    }

    setStatus("Calibrating...");
    try {
      const result: number = await receiver.calibrate(1_200);
      setNoiseThreshold(result);
      setStatus("Calibration complete");
    } catch {
      setStatus("Calibration failed");
    }
  };

  useEffect(() => {
    return () => {
      receiver.stop();
    };
  }, [receiver]);

  return {
    isListening,
    rawTerminal,
    terminal: displayTerminal,
    decryptStatus,
    crcError,
    status,
    noiseThreshold,
    confidence,
    analyserNode: receiver.getAnalyserNode(),
    encryption,
    setEncryption,
    start,
    stop,
    clear,
    calibrate,
  };
}
