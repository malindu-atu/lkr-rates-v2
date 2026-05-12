import type { Metadata } from "next";
import { DM_Mono, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "LKR Exchange Rates — Compare All Sri Lankan Banks",
  description:
    "Compare live TT buying and selling exchange rates from all major Sri Lankan banks. Supports 24 currencies. Updated daily.",
  keywords: ["exchange rate", "LKR", "Sri Lanka", "bank rates", "USD to LKR"],
  openGraph: {
    title: "LKR Exchange Rates",
    description: "Compare TT rates from all major Sri Lankan banks",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
