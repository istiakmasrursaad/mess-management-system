import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionTimeoutListener } from "@/components/SessionTimeoutListener";
import { ToastProvider } from "@/components/ToastProvider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "SoftTech Mess Manager",
  description: "Modern mess management system for hostels and student accommodations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground page-bg">
        <SessionTimeoutListener />
        <ToastProvider />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="w-full py-3 border-t border-white/5 mt-auto shrink-0 bg-[oklch(0.12_0.015_260)]">
          <p className="text-center text-xs text-muted-foreground font-medium tracking-widest uppercase">
            © 2026 <span className="text-gradient font-semibold">SoftTech</span> · All rights reserved
          </p>
        </footer>
      </body>
    </html>
  );
}
