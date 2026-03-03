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
          backgroundColor: "#09090b",
          fontFamily: "sans-serif",
        }}
      >
        {/* Gradient orb */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: "50%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            transform: "translateX(-50%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          {/* Logo & Title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              CR
            </div>
            <span
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: "white",
                letterSpacing: "-0.025em",
              }}
            >
              CodeReviewAI
            </span>
          </div>

          {/* Tagline */}
          <p
            style={{
              fontSize: 24,
              color: "#a1a1aa",
              textAlign: "center",
              maxWidth: 600,
              lineHeight: 1.5,
            }}
          >
            AI-powered code reviews that catch bugs, security issues, and
            maintainability problems.
          </p>

          {/* Features row */}
          <div
            style={{
              display: "flex",
              gap: 32,
              marginTop: 16,
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
                    color: "#71717a",
                    fontSize: 16,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#22c55e",
                    }}
                  />
                  {feature}
                </div>
              ),
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#52525b",
            fontSize: 16,
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
