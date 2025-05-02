import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ToastProvider } from '@/components/ui/use-toast';
import { ThemeProvider } from "@/providers/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Multi-Model Chat",
  description: "Compare responses from multiple language models side-by-side",
  keywords: "AI, language models, chat, comparison, OpenRouter",
  authors: [{ name: "Multi-Model Team" }],
  creator: "Multi-Model Team",
  metadataBase: new URL("https://multimodel.zkarimi.com"),
  openGraph: {
    type: "website",
    url: "https://multimodel.zkarimi.com",
    title: "Multi-Model Chat",
    description: "Compare responses from multiple language models side-by-side",
    siteName: "Multi-Model Chat",
    images: [
      {
        url: "https://multimodel.zkarimi.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Multi-Model Chat - Compare AI models side by side",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Multi-Model Chat",
    description: "Compare responses from multiple language models side-by-side",
    images: ["https://multimodel.zkarimi.com/og-image.png"],
    creator: "@zalmykarimi",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body 
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
