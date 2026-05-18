import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import * as XLSX from "xlsx";

function parseAmount(val: any): number {
  if (typeof val === "number") return Math.abs(val);
  return parseFloat(String(val).replace(/\./g, "").replace(",", ".").replace("-", "").trim());
}

function parseDate(val: any): Date {
  // Excel tarih formatı (sayısal) veya string
  if (typeof val === "number") {
    return XLSX.SSF.parse_date_code(val) 
      ? new Date(Date.UTC(1900, 0, val - 1)) 
      : new Date();
  }
  const str = String(val).trim();
  if (str.includes(".")) {
    const [day, month, year] = str.split(".");
    return new Date(`${year}-${month}-${day}`);
  }
  return new Date(str);
}

function guessCategory(description: string): string {
  const desc = description.toUpperCase();
  if (desc.includes("ELEKTRİK") || desc.includes("ELEKTRIK") || desc.includes("TEDAŞ") || desc.includes("AYEDAŞ") || desc.includes("BEDAŞ")) return "Elektrik";
  if (desc.includes("SU") || desc.includes("İSKİ") || desc.includes("ASKİ")) return "Su";
  if (desc.includes("DOĞALGAZ") || desc.includes("DOGALGAZ") || desc.includes("IGDAŞ")) return "Doğalgaz";
  if (desc.includes("TEMİZLİK") || desc.includes("TEMIZLIK")) return "Temizlik";
  if (desc.includes("ASANSÖR") || desc.includes("ASANSOR")) return "Asansör Bakım";
  if (desc.includes("SİGORTA") || desc.includes("SIGORTA")) return "Sigorta";
  if (desc.includes("VERGİ") || desc.includes("VERGI")) return "Vergi";
  return "Diğer";
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = await verifyToken(token || "");
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return Response.json({ error: "Dosya bulunamadı" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const categories = await prisma.expense_categories.findMany();
    const results = { matched: 0, skipped: 0, rows: [] as any[] };

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 3) { results.skipped++; continue; }

      const [dateVal, description, amountVal] = row;
      if (!dateVal || !amountVal) { results.skipped++; continue; }

      const amountRaw = typeof amountVal === "number" ? amountVal : parseFloat(String(amountVal).replace(",", "."));

      
      if (amountRaw >= 0) { results.skipped++; continue; }

      const amount  = Math.abs(amountRaw);
      const date    = dateVal instanceof Date ? dateVal : parseDate(dateVal);
      const desc    = String(description || "").trim();
      const catName = guessCategory(desc);
      const category = categories.find((c: { name: string; }) => c.name === catName) || categories.find((c: { name: string; }) => c.name === "Diğer");

      
      const existing = await prisma.expenses.findFirst({
        where: { amount, date, category_id: category?.id },
      });

      if (existing) {
        results.skipped++;
        results.rows.push({ description: desc, amount, date: date.toLocaleDateString("tr-TR"), status: "duplicate", category: catName });
        continue;
      }

      await prisma.expenses.create({
        data: {
          user_id: payload.userId,
          category_id: category?.id,
          amount,
          date,
          description: desc,
          payment_method: "Banka Transferi",
          status: "PAID",
          supplier: "Ziraat Bankası Ekstresinden",
        },
      });

      results.matched++;
      results.rows.push({ description: desc, amount, date: date.toLocaleDateString("tr-TR"), status: "imported", category: catName });
    }

    return Response.json({ success: true, results });
  } catch (error) {
    console.error("Import error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}