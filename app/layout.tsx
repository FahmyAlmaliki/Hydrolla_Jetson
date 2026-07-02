import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/app/components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HYDROLA — Dashboard Pemantauan Akuaponik",
  description:
    "Sistem monitoring kualitas air kolam akuaponik cerdas HYDROLA secara real-time. Pantau pH, DO, Suhu, dan Amonia dengan prediksi AI berbasis LSTM.",
  keywords: ["akuaponik", "IoT", "monitoring", "HYDROLA", "dashboard", "pH", "DO", "suhu"],
  authors: [{ name: "RnD IoT HME FT UB" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <body className="min-h-full" style={{ background: "var(--color-surface)" }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
