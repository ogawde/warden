import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Warden",
  description: "AI-powered engineering manager for GitLab repositories"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
