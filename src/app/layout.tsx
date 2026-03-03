import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CodeReviewAI — AI-Powered Code Reviews",
    template: "%s | CodeReviewAI",
  },
  description:
    "Automated code reviews that catch bugs, security issues, and maintainability problems before they reach production. Ship better code, faster.",
  keywords: [
    "code review",
    "AI code review",
    "automated code review",
    "GitHub",
    "pull request",
    "code quality",
    "security scanning",
    "static analysis",
  ],
  authors: [{ name: "CodeReviewAI" }],
  creator: "CodeReviewAI",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "CodeReviewAI",
    title: "CodeReviewAI — AI-Powered Code Reviews",
    description:
      "Automated code reviews that catch bugs, security issues, and maintainability problems before they reach production.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CodeReviewAI — Ship better code, faster",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeReviewAI — AI-Powered Code Reviews",
    description:
      "Automated code reviews that catch bugs, security issues, and maintainability problems before they reach production.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCProvider>{children}</TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
