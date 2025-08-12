import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "grandMA3 Docs Search",
  description: "AI-powered search for grandMA3 documentation with citations",
  keywords: "grandMA3, lighting, console, documentation, search, AI",
  authors: [{ name: "Your Name" }],
  openGraph: {
    title: "grandMA3 Docs Search",
    description: "Find grandMA3 commands and documentation instantly",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}