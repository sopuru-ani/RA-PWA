import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resident Assistant Organizer",
  description: "Tool to help Resident Assistants just a bit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
