import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TouchGrass",
  description:
    "A lightweight MVP for joining or hosting small real-life activity groups in Singapore.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-SG">
      <body>{children}</body>
    </html>
  );
}
