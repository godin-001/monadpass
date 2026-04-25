import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MonadPass",
  description: "NFT-based event ticketing on Monad",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
