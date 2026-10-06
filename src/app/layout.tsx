import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { InstallPrompt } from "@/components/InstallPrompt";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SoftTech Mess Manager",
  description: "Modern mess management system for hostels and student accommodations.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mess Manager",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground page-bg">
        <InstallPrompt />
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
