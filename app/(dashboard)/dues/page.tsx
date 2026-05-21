"use client";

import Breadcrumb from "@/app/component/breadcrumb";
import { useEffect, useMemo, useState } from "react";

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

const STATUS_LABEL = {
  PAID: {
    label: "Ödendi",
    bg: "#DCFCE7",
    color: "#166534",
  },

  PENDING: {
    label: "Bekliyor",
    bg: "#FEF3C7",
    color: "#92400E",
  },

  WAIVED: {
    label: "Muaf",
    bg: "#E5E7EB",
    color: "#4B5563",
  },
};

export default function DuesPage() {
  const [loading, setLoading] = useState(true);

  const [dues, setDues] = useState<Due[]>([]);

  const [selectedYear, setSelectedYear] =
    useState<number | "all">(CURRENT_YEAR);

  const [selectedMonth, setSelectedMonth] =
    useState<number | "all">("all");

  const [selectedStatus, setSelectedStatus] =
    useState<string>("all");

  const [selectedType, setSelectedType] =
    useState<string>("all");

  // ─── LOAD ───────────────────────────────────────
  const load = () => {
    setLoading(true);

    const params = new URLSearchParams();

    if (selectedYear !== "all") {
      params.append("year", String(selectedYear));
    }

    if (selectedMonth !== "all") {
      params.append("month", String(selectedMonth));
    }

    if (selectedStatus !== "all") {
      params.append("status", selectedStatus);
    }

    if (selectedType !== "all") {
      params.append("type", selectedType);
    }

    fetch(`/api/dues?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setDues(d.dues || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [
    selectedYear,
    selectedMonth,
    selectedStatus,
    selectedType,
  ]);

  // ─── STATS ──────────────────────────────────────
  const totalAmount = useMemo(() => {
    return dues.reduce(
      (s, d) => s + Number(d.aidat),
      0
    );
  }, [dues]);

  const paidCount = dues.filter(
    d => d.status === "PAID"
  ).length;

  const pendingCount = dues.filter(
    d => d.status === "PENDING"
  ).length;

  const waivedCount = dues.filter(
    d => d.status === "WAIVED"
  ).length;

  const paidAmount = dues
    .filter(d => d.status === "PAID")
    .reduce((s, d) => s + Number(d.aidat), 0);

  const collectionRate =
    totalAmount > 0
      ? Math.round((paidAmount / totalAmount) * 100)
      : 0;

  // ─── GROUPED ────────────────────────────────────
  const grouped = dues.reduce((acc: any, item) => {
    const key = `${item.year}-${item.month}`;

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(item);

    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(
    ([a], [b]) => {
      const [aY, aM] = a.split("-").map(Number);
      const [bY, bM] = b.split("-").map(Number);

      return bY - aY || bM - aM;
    }
  );

  return (
    <div>
      <Breadcrumb
        items={[
          {
            label: "Dashboard",
            url: "/dashboard",
          },
          {
            label: "Aidatlar",
          },
        ]}
      />

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          Aidatlar
        </h1>

        <div
          style={{
            display: "flex",
            gap: 10,
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
            style={selectStyle}
          >
            <option value="all">
              Tüm Yıllar
            </option>

            {YEARS.map(y => (
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
            style={selectStyle}
          >
            <option value="all">
              Tüm Aylar
            </option>

            {MONTHS.slice(1).map((m, i) => (
              <option
                key={i + 1}
                value={i + 1}
              >
                {m}
              </option>
            ))}
          </select>

          {/* STATUS */}
          <select
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value)
            }
            style={selectStyle}
          >
            <option value="all">
              Tüm Durumlar
            </option>

            <option value="PAID">
              Ödendi
            </option>

            <option value="PENDING">
              Bekliyor
            </option>

            <option value="WAIVED">
              Muaf
            </option>
          </select>

          {/* TYPE */}
          <select
            value={selectedType}
            onChange={(e) =>
              setSelectedType(e.target.value)
            }
            style={selectStyle}
          >
            <option value="all">
              Tüm Tipler
            </option>

            <option value="normal">
              Normal
            </option>

            <option value="dublex">
              Dublex
            </option>

            <option value="kapici">
              Kapıcı
            </option>
          </select>
        </div>
      </div>

      {/* STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(5, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Toplam Aidat",
            value:
              totalAmount.toLocaleString(
                "tr-TR"
              ) + " ₺",
            color: "#534AB7",
          },

          {
            label: "Ödendi",
            value: paidCount,
            color: "#16a34a",
          },

          {
            label: "Bekliyor",
            value: pendingCount,
            color: "#d97706",
          },

          {
            label: "Muaf",
            value: waivedCount,
            color: "#6b7280",
          },

          {
            label: "Tahsilat",
            value: `${collectionRate}%`,
            color: "#2563eb",
          },
        ].map(card => (
          <div
            key={card.label}
            style={{
              background: "white",
              borderRadius: 8,
              border: "1px solid #eee",
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#888",
                marginBottom: 8,
              }}
            >
              {card.label}
            </div>

            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: card.color,
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* TABLES */}
      {loading ? (
        <div style={emptyBox}>
          Yükleniyor...
        </div>
      ) : sortedGroups.length === 0 ? (
        <div style={emptyBox}>
          Veri bulunamadı.
        </div>
      ) : (
        sortedGroups.map(([key, items]: any) => {
          const [year, month] =
            key.split("-");

          return (
            <div
              key={key}
              style={{
                background: "white",
                borderRadius: 8,
                border: "1px solid #eee",
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              {/* HEADER */}
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom:
                    "1px solid #eee",
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  background: "#fafafa",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {
                    MONTHS[
                      Number(month)
                    ]
                  }{" "}
                  {year}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#888",
                  }}
                >
                  {items.length} kayıt
                </div>
              </div>

              {/* TABLE */}
              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Daire",
                      "Tip",
                      "Aidat",
                      "Durum",
                    ].map(h => (
                      <th
                        key={h}
                        style={th}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {items.map(
                    (item: Due) => {
                      const status =
                        STATUS_LABEL[
                          item.status
                        ];

                      return (
                        <tr
                          key={item.id}
                        >
                          <td style={td}>
                            {item.daire_no}
                          </td>

                          <td style={td}>
                            {
                              item.daire_type
                            }
                          </td>

                          <td
                            style={{
                              ...td,
                              fontWeight: 600,
                            }}
                          >
                            {Number(
                              item.aidat
                            ).toLocaleString(
                              "tr-TR"
                            )}{" "}
                            ₺
                          </td>

                          <td style={td}>
                            <span
                              style={{
                                padding:
                                  "4px 10px",
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 600,
                                background:
                                  status.bg,
                                color:
                                  status.color,
                              }}
                            >
                              {
                                status.label
                              }
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  fontSize: 13,
  background: "white",
};

const th: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  fontSize: 12,
  color: "#666",
  background: "#f9f9f9",
  borderBottom: "1px solid #eee",
};

const td: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #f3f4f6",
  fontSize: 13,
  color: "#333",
};

const emptyBox: React.CSSProperties = {
  background: "white",
  border: "1px solid #eee",
  borderRadius: 8,
  padding: 32,
  color: "#888",
};