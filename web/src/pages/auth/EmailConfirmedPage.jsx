import React from "react";

export default function EmailConfirmedPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #fff5f9 0%, #f3e8ff 100%)",
      fontFamily: "Arial, sans-serif",
      padding: 24,
    }}>
      <div style={{
        maxWidth: 560,
        width: "100%",
        background: "#ffffff",
        borderRadius: 20,
        boxShadow: "0 20px 60px rgba(123, 58, 180, 0.12)",
        padding: "48px 36px",
        textAlign: "center",
        border: "1px solid rgba(168, 85, 247, 0.1)",
      }}>
        <div style={{
          width: 88,
          height: 88,
          margin: "0 auto 24px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 42,
          color: "#fff",
          boxShadow: "0 10px 24px rgba(16, 185, 129, 0.3)",
        }}>
          ✓
        </div>

        <h1 style={{
          margin: 0,
          fontSize: "2rem",
          color: "#1f2937",
          fontWeight: 800,
        }}>
          Email confirmed
        </h1>

        <p style={{
          margin: "18px auto 0",
          maxWidth: 420,
          fontSize: "1.05rem",
          lineHeight: 1.7,
          color: "#4b5563",
        }}>
          Your email address has been successfully verified. You can now return to the app and continue creating your account.
        </p>

        <div style={{
          marginTop: 32,
          padding: "14px 18px",
          borderRadius: 12,
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          color: "#374151",
          fontSize: "0.98rem",
        }}>
          You may close this page now.
        </div>
      </div>
    </div>
  );
}
