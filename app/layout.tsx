import type { Metadata } from "next";

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
