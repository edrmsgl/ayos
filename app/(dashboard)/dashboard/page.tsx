"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

const MONTHS_SHORT = ["", "Oca", "Şub", "Mar", "Nis", "May", "Haz",
                          "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

type Summary = {
  thisMonth:    { income: number; expense: number; net: number };
  thisYear:     { income: number; expense: number; net: number };
  monthlyData:  { month: number; income: number; expense: number; net: number }[];
  yearlyData:   { year: number;  income: number; expense: number; net: number }[];
  balanceData:  { year: number;  balance: number }[];
  duesSummary:  { status: string; _count: { status: number }; _sum: { aidat: number } }[];
  currentYear:  number;
  currentMonth: number;
};

const fmt = (n: number) => Number(n).toLocaleString("tr-TR") + " ₺";
const fmtK = (n: number) => {
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + "K ₺";
  return n + " ₺";
};

// ─── Özel Tooltip ────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #eee", borderRadius: 8, padding: "10px 14px", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: "#333" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {Number(p.value).toLocaleString("tr-TR")} ₺
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData]       = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={emptyBox}>Yükleniyor...</div>;
  if (!data)   return <div style={emptyBox}>Veri alınamadı.</div>;

  const { thisMonth, thisYear, monthlyData, yearlyData, balanceData,
          duesSummary, currentYear, currentMonth } = data;

  const duesPaid    = duesSummary.find(d => d.status === "PAID");
  const duesPending = duesSummary.find(d => d.status === "PENDING");

  // Aylık grafik: sadece geçmiş aylar + bu ay göster
  const monthlyFiltered = monthlyData.filter(d => d.month <= currentMonth);

  return (
    <div style={{ paddingBottom: 40 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Dashboard</h1>

      {/* ── ÖZET KARTLAR ───────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { label: `${MONTHS_SHORT[currentMonth]} Gelir`,  value: fmt(thisMonth.income),  color: "#16a34a" },
          { label: `${MONTHS_SHORT[currentMonth]} Gider`,  value: fmt(thisMonth.expense), color: "#dc2626" },
          { label: `${MONTHS_SHORT[currentMonth]} Net`,    value: fmt(thisMonth.net),
            color: thisMonth.net >= 0 ? "#16a34a" : "#dc2626" },
          { label: `${currentYear} Gelir`,  value: fmt(thisYear.income),  color: "#16a34a" },
          { label: `${currentYear} Gider`,  value: fmt(thisYear.expense), color: "#dc2626" },
          { label: `${currentYear} Net`,    value: fmt(thisYear.net),
            color: thisYear.net >= 0 ? "#16a34a" : "#dc2626" },
          { label: "Aidat Ödendi",   value: `${duesPaid?._count.status ?? 0} daire`,   color: "#534AB7" },
          { label: "Aidat Bekliyor", value: `${duesPending?._count.status ?? 0} daire`, color: "#d97706" },
        ].map(c => (
          <div key={c.label} style={card}>
            <p style={cardLabel}>{c.label}</p>
            <p style={{ ...cardValue, color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* ── BU AY: Gelir vs Gider (tek bar yan yana) ───────── */}
      <Section title={`${MONTHS_SHORT[currentMonth]} ${currentYear} — Gelir & Gider`}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={[{ name: MONTHS_SHORT[currentMonth], gelir: thisMonth.income, gider: thisMonth.expense }]}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }} barCategoryGap="40%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} />
            <Bar dataKey="gelir" name="Gelir" fill="#4ade80" radius={[4,4,0,0]} />
            <Bar dataKey="gider" name="Gider" fill="#f87171" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        {/* Net göstergesi */}
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 13, color: thisMonth.net >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
          Net: {fmt(thisMonth.net)}
        </div>
      </Section>

      {/* ── BU YIL: Aylık gelir/gider bar grafik ───────────── */}
      <Section title={`${currentYear} — Aylık Gelir & Gider`}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyFiltered.map(d => ({
              name: MONTHS_SHORT[d.month],
              gelir: d.income, gider: d.expense,
            }))}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} />
            <Bar dataKey="gelir" name="Gelir" fill="#4ade80" radius={[3,3,0,0]} />
            <Bar dataKey="gider" name="Gider" fill="#f87171" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ── BU YIL: Aylık net çizgi grafik ─────────────────── */}
      <Section title={`${currentYear} — Aylık Net Bakiye`}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyFiltered.map(d => ({
              name: MONTHS_SHORT[d.month], net: d.net,
            }))}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#ccc" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="net" name="Net" stroke="#534AB7"
              strokeWidth={2} dot={{ r: 4, fill: "#534AB7" }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </Section>

      {/* ── YILLIK KARŞILAŞTIRMA: bar grafik ────────────────── */}
      <Section title="Yıllık Karşılaştırma — Gelir & Gider">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={yearlyData.map(d => ({
              name: String(d.year), gelir: d.income, gider: d.expense,
            }))}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} />
            <Bar dataKey="gelir" name="Gelir" fill="#4ade80" radius={[3,3,0,0]} />
            <Bar dataKey="gider" name="Gider" fill="#f87171" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ── KÜMÜLATİF BAKİYE: çizgi grafik ─────────────────── */}
      <Section title="Kümülatif Bakiye (Yıllara Göre Birikim)">
        <p style={{ fontSize: 12, color: "#888", marginBottom: 12, marginTop: -4 }}>
          Her yılın gelir−gider farkı bir önceki yıl üzerine eklenerek hesaplanır.
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={balanceData.map(d => ({
              name: String(d.year), bakiye: d.balance,
            }))}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#ccc" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="bakiye" name="Bakiye" stroke="#0ea5e9"
              strokeWidth={2} dot={{ r: 4, fill: "#0ea5e9" }} activeDot={{ r: 6 }}
              fill="#e0f2fe" fillOpacity={0.3} />
          </LineChart>
        </ResponsiveContainer>
      </Section>

      {/* ── BU YIL: Aylık kümülatif bakiye ─────────────────── */}
      <Section title={`${currentYear} — Aylık Kümülatif Bakiye`}>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 12, marginTop: -4 }}>
          Yıl içinde aylık net bakiyenin birikmesi.
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={(() => {
              let cum = 0;
              return monthlyFiltered.map(d => {
                cum += d.net;
                return { name: MONTHS_SHORT[d.month], bakiye: cum };
              });
            })()}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#ccc" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="bakiye" name="Bakiye" stroke="#8b5cf6"
              strokeWidth={2} dot={{ r: 4, fill: "#8b5cf6" }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "white", borderRadius: 8, border: "1px solid #eee", padding: "20px 24px", marginBottom: 20 }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  );
}

const card: React.CSSProperties = { background: "white", borderRadius: 8, border: "1px solid #eee", padding: "16px 20px" };
const cardLabel: React.CSSProperties = { fontSize: 12, color: "#888", marginBottom: 6 };
const cardValue: React.CSSProperties = { fontSize: 22, fontWeight: 700 };
const emptyBox: React.CSSProperties = { padding: 40, textAlign: "center", color: "#888" };