"use client";

import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetch("/api/expenses/summary")
      .then(r => r.json())
      .then(data => setSummary(data));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div style={card}>
          <p style={cardLabel}>Bu Ay Gider</p>
          <p style={cardValue}>{summary ? Number(summary.monthly).toLocaleString("tr-TR") + " ₺" : "—"}</p>
        </div>
        <div style={card}>
          <p style={cardLabel}>Bu Yıl Gider</p>
          <p style={cardValue}>{summary ? Number(summary.yearly).toLocaleString("tr-TR") + " ₺" : "—"}</p>
        </div>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "white", borderRadius: 8, border: "1px solid #eee",
  padding: "20px 24px",
};
const cardLabel: React.CSSProperties = { fontSize: 13, color: "#888", marginBottom: 8 };
const cardValue: React.CSSProperties = { fontSize: 28, fontWeight: 600, color: "#333" };