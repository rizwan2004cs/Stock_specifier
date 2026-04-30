import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stock Specifier",
  description: "NSE/BSE portfolio advisor with Groq-powered long-term analysis."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
