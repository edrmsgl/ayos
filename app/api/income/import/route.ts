import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

function daireNoToType(no: string): "normal" | "dublex" | "kapici" | null {
  if (no.toUpperCase() === "K") return "kapici";
  const num = parseInt(no);
  if (num >= 1 && num <= 16) return "normal";
  if (num === 17 || num === 18) return "dublex";
  return null;
}

export async function POST(req: NextRequest) {
  const formData    = await req.formData();
  const file        = formData.get("file") as File;
  const defaultAidat = parseFloat(formData.get("aidat") as string || "300");

  if (!file) {
    return NextResponse.json({ success: false, error: "Dosya bulunamadı" }, { status: 400 });
  }

  const buffer   = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];

  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const dataRows = rows.slice(1).filter(r => r.length >= 4);

  if (dataRows.length === 0) {
    return NextResponse.json({
      success: false,
      error: "Excel'de geçerli satır bulunamadı. Format: Ay | Yıl | Daire No | Doğalgaz | Aidat",
    }, { status: 400 });
  }

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const row of dataRows) {
    const month    = parseInt(row[0]);
    const year     = parseInt(row[1]);
    const daireNo  = String(row[2]).trim();
    const dogalgaz = parseFloat(row[3]) || 0;
    const aidat    = row[4] !== undefined && row[4] !== "" ? parseFloat(row[4]) : defaultAidat;

    // Validasyon
    if (!month || month < 1 || month > 12) { errors.push(`Geçersiz ay: ${row[0]}`); continue; }
    if (!year  || year < 2000)             { errors.push(`Geçersiz yıl: ${row[1]}`); continue; }

    const daireType = daireNoToType(daireNo);
    if (!daireType) { errors.push(`Geçersiz daire no: ${daireNo}`); continue; }

    const total = dogalgaz + aidat;

    try {
      const existing = await prisma.income.findUnique({
        where: { daire_no_year_month: { daire_no: daireNo, year, month } },
      });

      if (existing) {
        await prisma.income.update({
          where: { daire_no_year_month: { daire_no: daireNo, year, month } },
          data: { dogalgaz, aidat, total },
        });
        updated++;
      } else {
        await prisma.income.create({
          data: {
            daire_no:   daireNo,
            daire_type: daireType,
            year,
            month,
            dogalgaz,
            aidat,
            total,
            status: "PENDING",
          },
        });
        created++;
      }
    } catch (err) {
      errors.push(`Daire ${daireNo} (${month}/${year}): kayıt hatası`);
    }
  }

  return NextResponse.json({
    success: true,
    created,
    updated,
    total: created + updated,
    errors: errors.length > 0 ? errors : undefined,
  });
}
