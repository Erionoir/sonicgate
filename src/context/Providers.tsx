"use client";

import { ModemProvider } from "@/context/ModemContext";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps): React.JSX.Element {
  return <ModemProvider>{children}</ModemProvider>;
}
