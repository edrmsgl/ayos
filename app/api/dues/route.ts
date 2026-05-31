// app/api/dues/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

function parseStatus(val: string): "PAID" | "PENDING" | "WAIVED" {
  const v = String(val ?? "").trim().toLowerCase();
  if (v === "ödendi" || v === "paid")   return "PAID";
  if (v === "muaf"   || v === "waived") return "WAIVED";
  return "PENDING";
}

function parseDaireType(daireNo: string): "normal" | "dublex" | "kapici" {
  const v = String(daireNo ?? "").trim().toUpperCase();
  if (v === "K" || v === "KAPICI") return "kapici";
  return "normal";
}

// Tüm özel karakterleri ve boşlukları sil → "Aidat (₺)" → "aidat"
const normalize = (k: string) =>
  k.trim().toLowerCase().replace(/[\s()₺]/g, "");

// ─── GET /api/dues ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year   = searchParams.get("year");
  const month  = searchParams.get("month");
  const status = searchParams.get("status");
  const type   = searchParams.get("type");

  try {
    const dues = await prisma.dues.findMany({
      where: {
        ...(year   ? { year:  Number(year)   } : {}),
        ...(month  ? { month: Number(month)  } : {}),
        ...(status ? { status                } : {}),
        ...(type   ? { daire_type: type as any } : {}),
      },
      orderBy: [
        { year:  "desc" },
        { month: "desc" },
        { daire_no: "asc" },
      ],
    });

    const yearSummary = dues.reduce((acc: Record<number, {
      total: number; paid: number; pending: number; waived: number; paidAmount: number;
    }>, d) => {
      if (!acc[d.year]) acc[d.year] = { total: 0, paid: 0, pending: 0, waived: 0, paidAmount: 0 };
      acc[d.year].total++;
      acc[d.year][d.status === "PAID" ? "paid" : d.status === "WAIVED" ? "waived" : "pending"]++;
      if (d.status === "PAID") acc[d.year].paidAmount += Number(d.aidat);
      return acc;
    }, {});

    return NextResponse.json({ dues, yearSummary });
  } catch (err) {
    console.error("dues GET:", err);
    return NextResponse.json({ error: "Veriler alınamadı." }, { status: 500 });
  }
}

// ─── POST /api/dues — Excel yükle (çok sayfalı destekli) ───
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls"].includes(ext ?? "")) {
      return NextResponse.json({ error: "Sadece .xlsx veya .xls kabul edilir." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb     = XLSX.read(buffer, { type: "buffer" });

    let inserted = 0;
    let skipped  = 0;

    // ── Tüm sayfaları döngüyle işle ──────────────────────────
    for (const sheetName of wb.SheetNames) {
      const ws   = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

      for (const raw of rows) {
        // Anahtarları normalize et
        const row: Record<string, any> = {};
        for (const [k, v] of Object.entries(raw)) row[normalize(k)] = v;

        const month   = Number(row["ay"]    ?? row["month"]);
        const year    = Number(row["yıl"]   ?? row["yil"] ?? row["year"]);
        const daireNo = String(row["daireno"] ?? row["daire_no"] ?? "").trim();

        // "aidat" anahtarı normalize sonrası — boşsa 0
        const aidatRaw = row["aidat"] ?? row["aidat₺"] ?? "";
        const aidat    = aidatRaw === "" ? 0 : Number(aidatRaw);

        const durum   = String(row["durum"] ?? "");

        if (!month || !year || !daireNo) { skipped++; continue; }

        const existing = await prisma.dues.findFirst({
          where: { daire_no: daireNo, year, month },
        });

        if (existing) {
          await prisma.dues.update({
            where: { id: existing.id },
            data: {
              aidat,
              status:     parseStatus(durum),
              daire_type: parseDaireType(daireNo),
            },
          });
        } else {
          await prisma.dues.create({
            data: {
              daire_no:   daireNo,
              daire_type: parseDaireType(daireNo),
              year,
              month,
              aidat,
              status: parseStatus(durum),
            },
          });
        }
        inserted++;
      }
    }

    return NextResponse.json({
      message: `${inserted} kayıt içe aktarıldı${skipped ? `, ${skipped} satır atlandı` : ""}.`,
      inserted,
      skipped,
    });
  } catch (err) {
    console.error("dues POST:", err);
    return NextResponse.json({ error: "Yükleme sırasında hata oluştu." }, { status: 500 });
  }
}
