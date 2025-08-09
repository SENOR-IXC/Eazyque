import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EazyQue - Retail Billing Platform",
    template: "%s | EazyQue"
  },
  description: "Cloud-based retail billing and POS system for Indian retailers with GST compliance, inventory management, and real-time analytics",
  keywords: ["retail", "billing", "POS", "GST", "inventory", "India", "point of sale"],
  authors: [{ name: "EazyQue Team" }],
  creator: "EazyQue",
  publisher: "EazyQue",
  applicationName: "EazyQue",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
