import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeConfigProvider } from "@/components/theme-customizer";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Paperless Business OS",
    template: "%s · Paperless Business OS",
  },
  description:
    "Next-generation Cloud Multi-Tenant Business OS for Distributors, Wholesalers & Retailers.",
};

import { cookies } from "next/headers";
import { AuthProvider } from "@/context/auth-context";
import { LanguageProvider } from "@/context/language-context";
import { PageTitleSync } from "@/components/page-title-sync";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("paperless_access_token")?.value;
  const initialIsAuthenticated = Boolean(token);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeConfigProvider>
            <AuthProvider initialIsAuthenticated={initialIsAuthenticated}>
              <LanguageProvider>
                <PageTitleSync />
                {children}
                <Toaster />
              </LanguageProvider>
            </AuthProvider>
          </ThemeConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
