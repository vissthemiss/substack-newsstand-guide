import type { Metadata } from "next";
import { DM_Sans, Libre_Baskerville } from "next/font/google";
import { publication } from "@/lib/publication";
import "./globals.css";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: publication.name,
  description: publication.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${libreBaskerville.variable} ${dmSans.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
