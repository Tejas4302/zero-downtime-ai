import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zero Downtime",
  description: "AI operations intelligence for manufacturing",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
