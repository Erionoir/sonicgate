"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { decryptLineIfEncoded } from "@/lib/crypto/aes";
import { EncryptionConfig } from "@/types/modem";

export type DecryptStatus = "idle" | "working" | "error";

type UseDecryptResult = {
  rawTerminal: string;
  displayTerminal: string;
  decryptStatus: DecryptStatus;
  processChunk: (chunk: string) => void;
  clear: () => void;
};

export function useDecrypt(encryption: EncryptionConfig): UseDecryptResult {
  const [rawTerminal, setRawTerminal] = useState<string>("");
  const [displayTerminal, setDisplayTerminal] = useState<string>("");
  const [decryptStatus, setDecryptStatus] = useState<DecryptStatus>("idle");

  const encryptionRef = useRef<EncryptionConfig>(encryption);
  const lineBufferRef = useRef<string>("");

  useEffect(() => {
    encryptionRef.current = encryption;
  }, [encryption]);

  const appendDisplayLine = useCallback((line: string): void => {
    setDisplayTerminal((previous: string) => `${previous}${line}\n`);
  }, []);

  const processLine = useCallback(
    (line: string): void => {
      const { enabled, passphrase } = encryptionRef.current;

      if (!enabled) {
        appendDisplayLine(line);
        return;
      }

      if (!line.startsWith("@ENC:")) {
        appendDisplayLine(line);
        return;
      }

      setDecryptStatus("working");
      void decryptLineIfEncoded(line, passphrase)
        .then((decodedLine: string) => {
          appendDisplayLine(decodedLine);
          setDecryptStatus(decodedLine.startsWith("[DECRYPT FAILED") ? "error" : "idle");
        })
        .catch(() => {
          appendDisplayLine("[DECRYPT FAILED]");
          setDecryptStatus("error");
        });
    },
    [appendDisplayLine],
  );

  const processChunk = useCallback(
    (chunk: string): void => {
      setRawTerminal((previous: string) => previous + chunk);

      lineBufferRef.current += chunk;
      if (!lineBufferRef.current.includes("\n")) {
        return;
      }

      const lines: string[] = lineBufferRef.current.split("\n");
      const completeLines: string[] = lines.slice(0, -1);
      lineBufferRef.current = lines[lines.length - 1] ?? "";

      completeLines.forEach((line: string) => {
        processLine(line);
      });
    },
    [processLine],
  );

  const clear = useCallback((): void => {
    lineBufferRef.current = "";
    setRawTerminal("");
    setDisplayTerminal("");
    setDecryptStatus("idle");
  }, []);

  return {
    rawTerminal,
    displayTerminal,
    decryptStatus,
    processChunk,
    clear,
  };
}
