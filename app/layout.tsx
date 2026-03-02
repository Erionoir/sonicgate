import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/context/Providers";
import { NavBar } from "@/components/shared/NavBar";

export const metadata: Metadata = {
  title: "SonicGate",
  description: "Air-gapped near-ultrasonic data transfer",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <Providers>
          <main className="min-h-screen px-2 py-3 md:px-4">
            <NavBar />
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}