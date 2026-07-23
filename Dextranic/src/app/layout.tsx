import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dextranic | Presentation-as-Code",
  description: "Create fully editable PowerPoint presentations using structured code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="premium-scroll">{children}</body>
    </html>
  );
}
