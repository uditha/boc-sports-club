"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print"
      style={{
        position: "fixed", bottom: 24, right: 24,
        padding: "10px 20px", background: "#A05AFF", color: "white",
        border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600,
        cursor: "pointer", fontFamily: "inherit",
      }}
    >
      Print / Save PDF
    </button>
  );
}
