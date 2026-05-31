"use client";

import Breadcrumb from "@/app/component/breadcrumb";
import { useEffect, useMemo, useRef, useState } from "react";

type DaireType = "normal" | "dublex" | "kapici";

type Due = {
  id: number;
  daire_no: string;
  daire_type: DaireType;
  year: number;
  month: number;
  aidat: number;
  status: "PAID" | "PENDING" | "WAIVED";
};

type YearSummary = Record<number, {
  total: number;
  paid: number;
  pending: number;
  waived: number;
  paidAmount: number;
}>;

const MONTHS = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2014 }, (_, i) => 2015 + i);

const STATUS_LABEL = {
  PAID:    { label: "Ödendi",   bg: "#DCFCE7", color: "#166534" },
  PENDING: { label: "Bekliyor", bg: "#FEF3C7", color: "#92400E" },
  WAIVED:  { label: "Muaf",     bg: "#E5E7EB", color: "#4B5563" },
};

const TYPE_LABEL: Record<DaireType, string> = {
  normal: "Normal",
  dublex: "Dublex",
  kapici: "Kapıcı",
};

type ViewMode = "monthly" | "yearly";

export default function DuesPage() {
  const [loading, setLoading]           = useState(true);
  const [dues, setDues]                 = useState<Due[]>([]);
  const [yearSummary, setYearSummary]   = useState<YearSummary>({});
  const [viewMode, setViewMode]         = useState<ViewMode>("monthly");
  const [selectedYear, setSelectedYear] = useState<number | "all">(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType]   = useState<string>("all");

  const fileRef                         = useRef<HTMLInputElement>(null);
  const [uploading, setUploading]       = useState(false);
  const [uploadMsg, setUploadMsg]       = useState<{ text: string; ok: boolean } | null>(null);

  const load = () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (selectedYear   !== "all") p.append("year",   String(selectedYear));
    if (selectedMonth  !== "all") p.append("month",  String(selectedMonth));
    if (selectedStatus !== "all") p.append("status", selectedStatus);
    if (selectedType   !== "all") p.append("type",   selectedType);

    fetch(`/api/dues?${p}`)
      .then(r => r.json())
      .then(d => { setDues(d.dues || []); setYearSummary(d.yearSummary || {}); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [selectedYear, selectedMonth, selectedStatus, selectedType]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res  = await fetch("/api/dues", { method: "POST", body: fd });
      const data = await res.json();
      setUploadMsg({ text: data.message ?? data.error, ok: res.ok });
      if (res.ok) load(); // Tabloyu yenile
    } catch {
      setUploadMsg({ text: "Yükleme başarısız.", ok: false });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // ─── STATS ────────────────────────────────────────────────
  const totalAmount  = useMemo(() => dues.reduce((s, d) => s + Number(d.aidat), 0), [dues]);
  const paidAmount   = dues.filter(d => d.status === "PAID").reduce((s, d) => s + Number(d.aidat), 0);
  const paidCount    = dues.filter(d => d.status === "PAID").length;
  const pendingCount = dues.filter(d => d.status === "PENDING").length;
  const waivedCount  = dues.filter(d => d.status === "WAIVED").length;
  const collectRate  = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  // ─── GRUPLA ───────────────────────────────────────────────
  const grouped = dues.reduce((acc: Record<string, Due[]>, item) => {
    const key = `${item.year}-${String(item.month).padStart(2, "0")}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));

  // ─── YILLIK GÖRÜNÜM için yıllar ───────────────────────────
  const summaryYears = Object.keys(yearSummary).map(Number).sort((a, b) => b - a);

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard", url: "/dashboard" }, { label: "Aidatlar" }]} />

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Aidatlar</h1>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Görünüm modu */}
          <div style={{ display: "flex", border: "1px solid #ddd", borderRadius: 6, overflow: "hidden" }}>
            {(["monthly", "yearly"] as ViewMode[]).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                style={{ padding: "8px 14px", fontSize: 13, border: "none", cursor: "pointer",
                  background: viewMode === m ? "#534AB7" : "white",
                  color: viewMode === m ? "white" : "#555" }}>
                {m === "monthly" ? "Aylık" : "Yıllık"}
              </button>
            ))}
          </div>

          {/* Filtreler — sadece aylık görünümde */}
          {viewMode === "monthly" && (<>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value === "all" ? "all" : Number(e.target.value))} style={selectStyle}>
              <option value="all">Tüm Yıllar</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value === "all" ? "all" : Number(e.target.value))} style={selectStyle}>
              <option value="all">Tüm Aylar</option>
              {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} style={selectStyle}>
              <option value="all">Tüm Durumlar</option>
              <option value="PAID">Ödendi</option>
              <option value="PENDING">Bekliyor</option>
              <option value="WAIVED">Muaf</option>
            </select>
            <select value={selectedType} onChange={e => setSelectedType(e.target.value)} style={selectStyle}>
              <option value="all">Tüm Tipler</option>
              <option value="normal">Normal</option>
              <option value="dublex">Dublex</option>
              <option value="kapici">Kapıcı</option>
            </select>
          </>)}

          {/* Excel Yükle */}
          <label style={{ ...selectStyle, cursor: "pointer", background: uploading ? "#eee" : "#f0effe", color: "#534AB7", border: "1px solid #c4bff5", display: "flex", alignItems: "center", gap: 6 }}>
            {uploading ? "Yükleniyor..." : "📥 Excel Yükle"}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Yükleme mesajı */}
      {uploadMsg && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 6, fontSize: 13,
          background: uploadMsg.ok ? "#DCFCE7" : "#FEE2E2",
          color: uploadMsg.ok ? "#166534" : "#991B1B",
          border: `1px solid ${uploadMsg.ok ? "#86efac" : "#fca5a5"}` }}>
          {uploadMsg.text}
          <button onClick={() => setUploadMsg(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Toplam Aidat", value: totalAmount.toLocaleString("tr-TR") + " ₺", color: "#534AB7" },
          { label: "Ödendi",       value: paidCount,   color: "#16a34a" },
          { label: "Bekliyor",     value: pendingCount, color: "#d97706" },
          { label: "Muaf",         value: waivedCount,  color: "#6b7280" },
          { label: "Tahsilat",     value: `${collectRate}%`, color: "#2563eb" },
        ].map(card => (
          <div key={card.label} style={{ background: "white", borderRadius: 8, border: "1px solid #eee", padding: 16 }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* ─── YILLIK ÖZET GÖRÜNÜMÜ ─── */}
      {viewMode === "yearly" && (
        <div>
          {summaryYears.length === 0 ? (
            <div style={emptyBox}>Yıllık veri bulunamadı.</div>
          ) : (
            summaryYears.map(year => {
              const s = yearSummary[year];
              const rate = s.total > 0 ? Math.round((s.paid / s.total) * 100) : 0;
              return (
                <div key={year} style={{ background: "white", borderRadius: 8, border: "1px solid #eee", marginBottom: 16, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{year}</span>
                    <span style={{ fontSize: 12, color: "#888" }}>{s.total} kayıt</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
                    {[
                      { label: "Ödenen",    value: `${s.paid} daire`, sub: s.paidAmount.toLocaleString("tr-TR") + " ₺", color: "#16a34a" },
                      { label: "Bekleyen",  value: `${s.pending} daire`, color: "#d97706" },
                      { label: "Muaf",      value: `${s.waived} daire`,  color: "#6b7280" },
                      { label: "Tahsilat",  value: `%${rate}`, color: rate >= 80 ? "#16a34a" : rate >= 50 ? "#d97706" : "#dc2626" },
                    ].map((item, i) => (
                      <div key={i} style={{ padding: "14px 16px", borderRight: i < 3 ? "1px solid #eee" : "none" }}>
                        <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>{item.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</div>
                        {item.sub && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{item.sub}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── AYLIK TABLO GÖRÜNÜMÜ ─── */}
      {viewMode === "monthly" && (
        loading ? (
          <div style={emptyBox}>Yükleniyor...</div>
        ) : sortedGroups.length === 0 ? (
          <div style={emptyBox}>Veri bulunamadı. Excel yükleyerek başlayın.</div>
        ) : (
          sortedGroups.map(([key, items]) => {
            const [year, month] = key.split("-");
            const groupPaid = items.filter(i => i.status === "PAID").reduce((s, i) => s + Number(i.aidat), 0);
            const groupTotal = items.reduce((s, i) => s + Number(i.aidat), 0);

            return (
              <div key={key} style={{ background: "white", borderRadius: 8, border: "1px solid #eee", overflow: "hidden", marginBottom: 20 }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafafa" }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {MONTHS[Number(month)]} {year}
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#888" }}>
                    <span>{items.length} daire</span>
                    <span style={{ color: "#16a34a", fontWeight: 600 }}>
                      {groupPaid.toLocaleString("tr-TR")} ₺ / {groupTotal.toLocaleString("tr-TR")} ₺
                    </span>
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Daire", "Tip", "Aidat", "Durum"].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items
                      .sort((a, b) => {
                        // Sayısal daire sıralama (K kapıcı en sona)
                        const na = Number(a.daire_no) || 999;
                        const nb = Number(b.daire_no) || 999;
                        return na - nb;
                      })
                      .map(item => {
                        const s = STATUS_LABEL[item.status];
                        return (
                          <tr key={item.id} style={{ background: item.status === "PENDING" ? "#fffbeb" : "white" }}>
                            <td style={tdStyle}><strong>Daire {item.daire_no}</strong></td>
                            <td style={tdStyle}>{TYPE_LABEL[item.daire_type]}</td>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>
                              {Number(item.aidat).toLocaleString("tr-TR")} ₺
                            </td>
                            <td style={tdStyle}>
                              <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
                                {s.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            );
          })
        )
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, background: "white" };
const thStyle: React.CSSProperties    = { padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#666", background: "#f9f9f9", borderBottom: "1px solid #eee" };
const tdStyle: React.CSSProperties    = { padding: "10px 12px", borderBottom: "1px solid #f3f4f6", fontSize: 13, color: "#333" };
const emptyBox: React.CSSProperties   = { background: "white", border: "1px solid #eee", borderRadius: 8, padding: 32, color: "#888", textAlign: "center" };