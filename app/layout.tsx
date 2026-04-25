import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { DEFAULT_THEME, getThemeBootScript } from "@/lib/theme";
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
    <html
      lang="en-SG"
      data-theme={DEFAULT_THEME}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: getThemeBootScript() }} />
      </head>
      <body className="bg-slate-50 text-slate-950 antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
