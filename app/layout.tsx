import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FIT VIDEO GENERATOR",
  description: "Перевдягання фото через Gemini AI та генерація fit video через Seedance 2.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
