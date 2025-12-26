import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/Navbar";
import { ShutdownButton } from "@/components/ShutdownButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mega Sena Analyzer - Análise Estatística e Geração de Jogos",
  description: "Sistema completo de análise estatística e geração de jogos para Mega Sena. Análise de ciclos, scores de qualidade, conferidor e mais.",
  keywords: ["Mega Sena", "Loteria", "Análise Estatística", "Geração de Jogos", "Conferidor", "Estatísticas"],
  authors: [{ name: "Mega Sena Analyzer" }],
  openGraph: {
    title: "Mega Sena Analyzer",
    description: "Análise estatística e geração de jogos para Mega Sena",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mega Sena Analyzer",
    description: "Análise estatística e geração de jogos para Mega Sena",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <Navbar />
        {children}
        <Toaster />
        <ShutdownButton />
      </body>
    </html>
  );
}
