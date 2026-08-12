import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Max",
  description: "A personal wealth agent that reads your budget and tells you where you stand.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="border-b px-6 py-4 flex gap-6 items-center" style={{ borderColor: "var(--border)" }}>
          <Link href="/" className="font-semibold">
            Max
          </Link>
          <Link href="/" className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Upload
          </Link>
          <Link href="/dashboard" className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Dashboard
          </Link>
        </nav>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
