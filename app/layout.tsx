import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FIT VIDEO GENERATOR — Gemini + Seedance 2.0",
  description:
    "Перевдягання фото через Gemini AI та генерація fit video через Seedance 2.0",
  keywords: ["fit video", "virtual try-on", "gemini", "seedance", "fashion", "AI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
