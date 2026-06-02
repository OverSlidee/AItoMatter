import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "VeloLabs CEM — Autonomous Computational Engineering Platform",
  description: "An agentic compiler mapping text prompts and engineering datasheets into watertight physical voxel geometry.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col relative">
        {/* Futuristic glowing backdrop */}
        <div className="glow-bg" />
        <div className="dot-grid" />
        {children}
      </body>
    </html>
  );
}
