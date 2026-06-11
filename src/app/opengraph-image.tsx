import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CodeReviewAI — AI-Powered Code Reviews";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#06070d",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient orbs */}
        <div
          style={{
            position: "absolute",
            top: -200,
            left: "30%",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(97,120,247,0.2) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -200,
            right: "20%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,196,196,0.15) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 28,
            position: "relative",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "linear-gradient(135deg, #495CC9, #6178F7, #00C4C4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 52,
                fontWeight: 700,
                color: "white",
                letterSpacing: "-0.03em",
              }}
            >
              CodeReview
              <span
                style={{
                  background: "linear-gradient(135deg, #93A4FB, #00C4C4)",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                AI
              </span>
            </span>
          </div>

          {/* Tagline */}
          <p
            style={{
              fontSize: 26,
              color: "#a1a1aa",
              textAlign: "center",
              maxWidth: 650,
              lineHeight: 1.5,
            }}
          >
            AI-powered code reviews that catch bugs, security issues, and
            maintainability problems before they reach production.
          </p>

          {/* Feature pills */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 8,
            }}
          >
            {["Instant Feedback", "Security Scanning", "GitHub Integration"].map(
              (feature) => (
                <div
                  key={feature}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: "rgba(97,120,247,0.1)",
                    border: "1px solid rgba(97,120,247,0.2)",
                    borderRadius: 999,
                    padding: "8px 18px",
                    color: "#B3C0FC",
                    fontSize: 15,
                    fontWeight: 500,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#40C786",
                    }}
                  />
                  {feature}
                </div>
              ),
            )}
          </div>
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#52525b",
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: "0.05em",
          }}
        >
          Ship better code, faster
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
