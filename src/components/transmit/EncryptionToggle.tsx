"use client";

import { EncryptionConfig } from "@/types/modem";

type EncryptionToggleProps = {
  encryption: EncryptionConfig;
  onChange: (next: Partial<EncryptionConfig>) => void;
};

export function EncryptionToggle({ encryption, onChange }: EncryptionToggleProps): React.JSX.Element {
  return (
    <section className="rounded-lg border border-zinc-700 bg-zinc-900/80 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Encryption</h3>

      <label className="mb-3 inline-flex items-center gap-2 text-xs text-zinc-300">
        <input
          type="checkbox"
          checked={encryption.enabled}
          onChange={(event) => onChange({ enabled: event.target.checked })}
        />
        AES-256 (PBKDF2 passphrase)
      </label>

      <input
        type="password"
        value={encryption.passphrase}
        onChange={(event) => onChange({ passphrase: event.target.value })}
        placeholder="Shared passphrase"
        className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200"
      />
    </section>
  );
}
