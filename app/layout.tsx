import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/app/components/Sidebar";
import TopBar  from "@/app/components/TopBar";

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
        {/* Sidebar */}
        <Sidebar />

        {/* Content shell: offset by sidebar width */}
        <div className="ml-[272px] flex flex-col min-h-screen">
          {/* Topbar */}
          <TopBar />

          {/* Page content: offset by topbar height */}
          <main className="flex-1 pt-16">
            <div className="max-w-[1280px] mx-auto px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
