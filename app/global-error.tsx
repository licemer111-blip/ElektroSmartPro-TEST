"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("🔴 Global Error:", error);
  }, [error]);

  return (
    <html lang="pl">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            background: "#f8fafc",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "28rem" }}>
            <div
              style={{
                fontSize: "4rem",
                marginBottom: "1rem",
              }}
            >
              ⚠️
            </div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: "0.5rem",
              }}
            >
              Krytyczny błąd aplikacji
            </h1>
            <p
              style={{
                color: "#64748b",
                marginBottom: "0.25rem",
                fontSize: "0.875rem",
              }}
            >
              Przepraszamy, wystąpił nieoczekiwany błąd.
            </p>
            {error.digest && (
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  marginBottom: "1.5rem",
                }}
              >
                ID błędu: {error.digest}
              </p>
            )}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
                flexWrap: "wrap",
                marginTop: "1.5rem",
              }}
            >
              <button
                onClick={reset}
                style={{
                  padding: "0.625rem 1.25rem",
                  backgroundColor: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Spróbuj ponownie
              </button>
              <a
                href="/dashboard"
                style={{
                  padding: "0.625rem 1.25rem",
                  backgroundColor: "white",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Wróć do Dashboard
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
