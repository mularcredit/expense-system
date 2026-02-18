import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Providers } from "@/components/Providers";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: "CapitalPay expense system",
  description: "Smart expense management and automated approval system",
  icons: {
    icon: '/SITE.png?v=2',
    shortcut: '/SITE.png?v=2',
    apple: '/SITE.png?v=2',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body className={`antialiased min-h-screen ${lexend.variable} ${GeistSans.variable} font-sans`} style={{ backgroundColor: 'var(--gds-bg)', color: 'var(--gds-text-main)' }} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
