import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ScanLoadingProvider } from "@/components/scan-loading-provider";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans"
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono"
});

export const metadata: Metadata = {
  title: "Warden",
  description: "AI-powered engineering manager for GitLab repositories"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("font-sans", geistSans.variable, geistMono.variable)}
    >
      <body className="min-h-screen bg-background antialiased">
        <ScanLoadingProvider>
          <SiteHeader />
          {children}
          <Toaster />
        </ScanLoadingProvider>
      </body>
    </html>
  );
}
