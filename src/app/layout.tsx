import type { Metadata } from "next";
import { Schibsted_Grotesk, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { themeInitScript } from "@/components/theme/theme-init-script";
import "./globals.css";

const grotesk = Schibsted_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Max",
  description: "A personal wealth agent that reads your budget and tells you where you stand.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${grotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies a saved theme choice before first paint, avoiding a flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body className="min-h-full flex flex-col">
        <nav className="border-b px-6 py-4 flex gap-6 items-center" style={{ borderColor: "var(--hairline-3)" }}>
          <Link href="/" className="font-semibold">
            Max
          </Link>
          <Link href="/" className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Upload
          </Link>
          <Link href="/dashboard" className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Dashboard
          </Link>
          <Link href="/styleguide" className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Styleguide
          </Link>
        </nav>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
