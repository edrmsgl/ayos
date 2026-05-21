"use client";

import { useState, useEffect } from "react";
import Breadcrumb from "../../component/breadcrumb";
import { Modal } from "@/app/component/modal";

// ─── Tipler ───────────────────────────────────────────────────────────────────
type DaireType = "normal" | "dublex" | "kapici";

type Daire = {
  no: string;
  type: DaireType;
};

type GelirKalem = {
  id: number;
  daire_no: string;
  daire_type: DaireType;
  year: number;
  month: number;
  dogalgaz: number;
  aidat: number;
  total: number;
  status: "PAID" | "PENDING" | "WAIVED";
};

// ─── Sabitler ─────────────────────────────────────────────────────────────────
const DAIRELER: Daire[] = [
  ...Array.from({ length: 16 }, (_, i) => ({
    no: String(i + 1),
    type: "normal" as DaireType,
  })),
  { no: "17", type: "dublex" },
  { no: "18", type: "dublex" },
  { no: "K", type: "kapici" },
];

const DAIRE_LABEL: Record<DaireType, string> = {
  normal: "Normal Daire",
  dublex: "Dublex",
  kapici: "Kapıcı Dairesi",
};

const STATUS_LABEL: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  PAID: { label: "Ödendi", bg: "#D1FAE5", color: "#065F46" },
  PENDING: { label: "Bekliyor", bg: "#FEF3C7", color: "#92400E" },
  WAIVED: { label: "Muaf", bg: "#F3F4F6", color: "#6B7280" },
};

const MONTHS = [
  "",
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

const CURRENT_YEAR = new Date().getFullYear();

const YEARS = Array.from(
  { length: CURRENT_YEAR - 2014 },
  (_, i) => 2015 + i
);

// ─── Stiller ──────────────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#555",
  marginBottom: 5,
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #ddd",
  borderRadius: 6,
  fontSize: 13,
  boxSizing: "border-box",
};

const th: React.CSSProperties = {
  padding: "8px 12px",
  textAlign: "left",
  fontWeight: 600,
  color: "#555",
  fontSize: 12,
  background: "#f9f9f9",
  borderBottom: "1px solid #eee",
};

const td: React.CSSProperties = {
  padding: "8px 12px",
  color: "#333",
  fontSize: 13,
  borderBottom: "1px solid #f0f0f0",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────
export default function GelirlerPage() {
  const [gelirler, setGelirler] = useState<GelirKalem[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── FILTERS ─────────────────────────────────────────────
  const [selectedYear, setSelectedYear] = useState<number | "all">(
    CURRENT_YEAR
  );

  const [selectedMonth, setSelectedMonth] = useState<number | "all">(
    new Date().getMonth() + 1
  );

  // ─────────────────────────────────────────────────────────

  const [aidat, setAidat] = useState(300);
  const [aidatInput, setAidatInput] = useState("300");

  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const [showAidat, setShowAidat] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const [editKalem, setEditKalem] = useState<GelirKalem | null>(null);

  const [showTarife, setShowTarife] = useState(false);

  const [tarifeForm, setTarifeForm] = useState({
    normal_dogalgaz: "",
    dublex_dogalgaz: "",
    kapici_dogalgaz: "",
    aidat: "300",
  });

  // ─── LOAD ────────────────────────────────────────────────
  const load = () => {
    setLoading(true);

    const params = new URLSearchParams();

    if (selectedYear !== "all") {
      params.append("year", String(selectedYear));
    }

    if (selectedMonth !== "all") {
      params.append("month", String(selectedMonth));
    }

    fetch(`/api/income?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setGelirler(d.gelirler || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [selectedYear, selectedMonth]);

  // ─── HESAPLAMALAR ────────────────────────────────────────
  const ayGelirler = gelirler;

  const toplamDoğalgaz = ayGelirler.reduce(
    (s, g) => s + Number(g.dogalgaz),
    0
  );

  const toplamAidat = ayGelirler.reduce(
    (s, g) => s + Number(g.aidat),
    0
  );

  const toplamGenel = ayGelirler.reduce(
    (s, g) => s + Number(g.total),
    0
  );

  const odenenSayisi = ayGelirler.filter(
    (g) => g.status === "PAID"
  ).length;

  // ─── DAİRE MAP ───────────────────────────────────────────
  const daireMap = Object.fromEntries(
    ayGelirler.map((g) => [
      `${g.year}-${g.month}-${g.daire_no}`,
      g,
    ])
  );

  // ─── IMPORT ──────────────────────────────────────────────
  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);

    const formData = new FormData();

    formData.append("file", importFile);
    formData.append("aidat", String(aidat));

    const res = await fetch("/api/income/import", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setImportResult(data);
    setImporting(false);

    if (data.success) load();
  };

  // ─── MANUEL TARİFE ───────────────────────────────────────
  const handleManuelTarife = async () => {
    const res = await fetch("/api/income/tarife", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        year:
          selectedYear === "all"
            ? CURRENT_YEAR
            : selectedYear,

        month:
          selectedMonth === "all"
            ? new Date().getMonth() + 1
            : selectedMonth,

        ...tarifeForm,

        normal_dogalgaz: parseFloat(
          tarifeForm.normal_dogalgaz
        ),

        dublex_dogalgaz: parseFloat(
          tarifeForm.dublex_dogalgaz
        ),

        kapici_dogalgaz: parseFloat(
          tarifeForm.kapici_dogalgaz
        ),

        aidat: parseFloat(tarifeForm.aidat),
      }),
    });

    const data = await res.json();

    if (data.success) {
      setShowTarife(false);
      load();
    }
  };

  // ─── STATUS UPDATE ───────────────────────────────────────
  const handleStatusUpdate = async (status: string) => {
    if (!editKalem) return;

    await fetch(`/api/income/${editKalem.id}`, {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({ status }),
    });

    setShowStatus(false);

    load();
  };

  // ─── AIDAT SAVE ──────────────────────────────────────────
  const handleAidatSave = () => {
    const val = parseFloat(aidatInput);

    if (!isNaN(val) && val > 0) {
      setAidat(val);
    }

    setShowAidat(false);
  };

  // ─── GROUPED DATA ────────────────────────────────────────
  const groupedData = ayGelirler.reduce((acc: any, item) => {
    const key = `${item.year}-${item.month}`;

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(item);

    return acc;
  }, {});

  const sortedGroups = Object.entries(groupedData).sort(
    ([a], [b]) => {
      const [aYear, aMonth] = a.split("-").map(Number);
      const [bYear, bMonth] = b.split("-").map(Number);

      return bYear - aYear || bMonth - aMonth;
    }
  );

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <Breadcrumb
        items={[
          {
            label: "Dashboard",
            url: "/dashboard",
          },
          {
            label: "Gelirler",
          },
        ]}
      />

      {/* ─── HEADER ───────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          Gelirler
        </h1>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          {/* YEAR */}
          <select
            value={selectedYear}
            onChange={(e) =>
              setSelectedYear(
                e.target.value === "all"
                  ? "all"
                  : Number(e.target.value)
              )
            }
            style={{
              padding: "7px 12px",
              border: "1px solid #ddd",
              borderRadius: 6,
              fontSize: 13,
            }}
          >
            <option value="all">Tüm Yıllar</option>

            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* MONTH */}
          <select
            value={selectedMonth}
            onChange={(e) =>
              setSelectedMonth(
                e.target.value === "all"
                  ? "all"
                  : Number(e.target.value)
              )
            }
            style={{
              padding: "7px 12px",
              border: "1px solid #ddd",
              borderRadius: 6,
              fontSize: 13,
            }}
          >
            <option value="all">Tüm Aylar</option>

            {MONTHS.slice(1).map((m, i) => (
              <option key={i + 1} value={i + 1}>
                {m}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAidat(true)}
            style={{
              padding: "8px 14px",
              background: "white",
              border: "1px solid #ddd",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            💰 Aidat: {aidat.toLocaleString("tr-TR")}₺
          </button>

          <button
            onClick={() => {
              setTarifeForm({
                normal_dogalgaz: "",
                dublex_dogalgaz: "",
                kapici_dogalgaz: "",
                aidat: String(aidat),
              });

              setShowTarife(true);
            }}
            style={{
              padding: "8px 14px",
              background: "white",
              border: "1px solid #ddd",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            📝 Manuel Giriş
          </button>

          <button
            onClick={() => {
              setImportResult(null);
              setImportFile(null);
              setShowImport(true);
            }}
            style={{
              padding: "8px 16px",
              background: "#534AB7",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            📥 Excel Yükle
          </button>
        </div>
      </div>

      {/* ─── ÖZET ─────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Toplam Doğalgaz",
            value:
              toplamDoğalgaz.toLocaleString("tr-TR") +
              " ₺",
            color: "#f59e0b",
          },

          {
            label: "Toplam Aidat",
            value:
              toplamAidat.toLocaleString("tr-TR") +
              " ₺",
            color: "#10b981",
          },

          {
            label: "Toplam Gelir",
            value:
              toplamGenel.toLocaleString("tr-TR") +
              " ₺",
            color: "#534AB7",
          },

          {
            label: "Ödeme Durumu",
            value: `${odenenSayisi} / ${ayGelirler.length} ödendi`,
            color: "#3b82f6",
          },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              background: "white",
              borderRadius: 8,
              border: "1px solid #eee",
              padding: "16px 20px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#888",
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              {k.label}
            </div>

            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: k.color,
              }}
            >
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* ─── TABLES ───────────────────────────────────── */}
      {loading ? (
        <div
          style={{
            padding: 24,
            background: "white",
            borderRadius: 8,
            border: "1px solid #eee",
          }}
        >
          Yükleniyor...
        </div>
      ) : sortedGroups.length === 0 ? (
        <div
          style={{
            padding: 24,
            background: "white",
            borderRadius: 8,
            border: "1px solid #eee",
            color: "#888",
          }}
        >
          Veri bulunamadı.
        </div>
      ) : (
        sortedGroups.map(([groupKey, records]: any) => {
          const [year, month] = groupKey.split("-");

          const toplamDogalgaz = records.reduce(
            (s: number, g: GelirKalem) =>
              s + Number(g.dogalgaz),
            0
          );

          const toplamAidat = records.reduce(
            (s: number, g: GelirKalem) =>
              s + Number(g.aidat),
            0
          );

          const toplam = records.reduce(
            (s: number, g: GelirKalem) =>
              s + Number(g.total),
            0
          );

          return (
            <div
              key={groupKey}
              style={{
                background: "white",
                borderRadius: 8,
                border: "1px solid #eee",
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #eee",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#fafafa",
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {MONTHS[Number(month)]} {year}
                </span>

                <span
                  style={{
                    fontSize: 12,
                    color: "#888",
                  }}
                >
                  {records.length} kayıt
                </span>
              </div>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th style={th}>Daire No</th>
                    <th style={th}>Tip</th>
                    <th style={th}>Doğalgaz</th>
                    <th style={th}>Aidat</th>
                    <th style={th}>Toplam</th>
                    <th style={th}>Durum</th>
                    <th style={th}>İşlem</th>
                  </tr>
                </thead>

                <tbody>
                  {DAIRELER.map((daire) => {
                    const kalem =
                      daireMap[
                        `${year}-${month}-${daire.no}`
                      ];

                    const s = kalem
                      ? STATUS_LABEL[kalem.status]
                      : null;

                    return (
                      <tr key={daire.no}>
                        <td
                          style={{
                            ...td,
                            fontWeight: 600,
                          }}
                        >
                          {daire.type === "kapici"
                            ? "Kapıcı"
                            : `Daire ${daire.no}`}
                        </td>

                        <td style={td}>
                          {DAIRE_LABEL[daire.type]}
                        </td>

                        <td style={td}>
                          {kalem
                            ? Number(
                                kalem.dogalgaz
                              ).toLocaleString("tr-TR") +
                              " ₺"
                            : "—"}
                        </td>

                        <td style={td}>
                          {kalem
                            ? Number(
                                kalem.aidat
                              ).toLocaleString("tr-TR") +
                              " ₺"
                            : "—"}
                        </td>

                        <td
                          style={{
                            ...td,
                            fontWeight: 700,
                            color: "#534AB7",
                          }}
                        >
                          {kalem
                            ? Number(
                                kalem.total
                              ).toLocaleString("tr-TR") +
                              " ₺"
                            : "—"}
                        </td>

                        <td style={td}>
                          {s ? (
                            <span
                              style={{
                                padding: "3px 10px",
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 500,
                                background: s.bg,
                                color: s.color,
                              }}
                            >
                              {s.label}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td style={td}>
                          {kalem && (
                            <button
                              onClick={() => {
                                setEditKalem(kalem);
                                setShowStatus(true);
                              }}
                              style={{
                                padding: "3px 10px",
                                fontSize: 12,
                                border: "1px solid #ddd",
                                borderRadius: 4,
                                cursor: "pointer",
                                background: "transparent",
                              }}
                            >
                              Güncelle
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr
                    style={{
                      background: "#f9f9f9",
                    }}
                  >
                    <td
                      colSpan={2}
                      style={{
                        padding: "10px 12px",
                        fontWeight: 600,
                      }}
                    >
                      Toplam
                    </td>

                    <td
                      style={{
                        padding: "10px 12px",
                        fontWeight: 600,
                      }}
                    >
                      {toplamDogalgaz.toLocaleString(
                        "tr-TR"
                      )}{" "}
                      ₺
                    </td>

                    <td
                      style={{
                        padding: "10px 12px",
                        fontWeight: 600,
                      }}
                    >
                      {toplamAidat.toLocaleString(
                        "tr-TR"
                      )}{" "}
                      ₺
                    </td>

                    <td
                      style={{
                        padding: "10px 12px",
                        fontWeight: 700,
                        color: "#534AB7",
                      }}
                    >
                      {toplam.toLocaleString("tr-TR")} ₺
                    </td>

                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          );
        })
      )}

      {/* MODALS burada aynı şekilde devam edecek */}
    </div>
  );
}