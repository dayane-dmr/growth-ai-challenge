import type { Metadata } from "next";

import "./global.css";

export const metadata: Metadata = {
  title: "Growth AI Challenge",
  description: "Growth AI Challenge",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="app-background">{children}</body>
    </html>
  );
}
