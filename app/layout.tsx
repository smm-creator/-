import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FIT VIDEO GENERATOR",
  description: "Перевдягання фото через Gemini та генерація відео через Seedance 2.0"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
