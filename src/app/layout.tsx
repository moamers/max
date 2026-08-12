import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Max API",
  description: "Backend API for Max — parses budget workbooks and serves spending insights.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
