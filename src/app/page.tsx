import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";

export const metadata: Metadata = {
  title: "CodeReviewAI — AI-Powered Code Reviews",
  description:
    "Automated code reviews that catch bugs, security issues, and maintainability problems before they reach production. Ship better code, faster.",
  alternates: {
    canonical: "/",
  },
};

/** JSON-LD structured data for the landing page */
function LandingJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CodeReviewAI",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description:
      "Automated AI-powered code reviews that catch bugs, security issues, and maintainability problems before they reach production.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Instant AI feedback on pull requests",
      "Security vulnerability scanning",
      "GitHub integration",
      "Risk scoring",
      "Private repository support",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function HomePage() {
  return (
    <>
      <LandingJsonLd />
      <LandingPage />
    </>
  );
}
