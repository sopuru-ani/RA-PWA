import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "Domus",
  description: "Tool to help Resident Assistants just a bit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="MyWebSite" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
>        
          <PWARegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
