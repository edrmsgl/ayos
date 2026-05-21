import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

type DaireType =
  | "normal"
  | "dublex"
  | "kapici";

function getDaireType(
  no: string
): DaireType {
  const value = no
    .toString()
    .trim()
    .toUpperCase();

  if (value === "K") {
    return "kapici";
  }

  const num = Number(value);

  if (num >= 17 && num <= 18) {
    return "dublex";
  }

  return "normal";
}

function normalizeStatus(
  status: string
) {
  const s = status
    ?.toString()
    .trim()
    .toUpperCase();

  if (
    s === "PAID" ||
    s === "ÖDENDI" ||
    s === "ÖDENDİ"
  ) {
    return "PAID";
  }

  if (
    s === "WAIVED" ||
    s === "MUAF"
  ) {
    return "WAIVED";
  }

  return "PENDING";
}

export async function POST(
  req: NextRequest
) {
  try {
    const formData =
      await req.formData();

    const file =
      formData.get(
        "file"
      ) as File | null;

    if (!file) {
      return Response.json(
        {
          error:
            "Excel dosyası gerekli",
        },
        {
          status: 400,
        }
      );
    }

    // ─────────────────────────────
    // FILE BUFFER
    // ─────────────────────────────
    const bytes =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(bytes);

    // ─────────────────────────────
    // XLSX READ
    // ─────────────────────────────
    const workbook =
      XLSX.read(buffer, {
        type: "buffer",
      });

    const firstSheet =
      workbook.SheetNames[0];

    const worksheet =
      workbook.Sheets[firstSheet];

    const rows: any[] =
      XLSX.utils.sheet_to_json(
        worksheet,
        {
          defval: "",
        }
      );

    let created = 0;
    let updated = 0;

    // ─────────────────────────────
    // LOOP
    // ─────────────────────────────
    for (const row of rows) {
      const month = Number(
        row["Ay"]
      );

      const year = Number(
        row["Yıl"]
      );

      const daire_no = row[
        "Daire No"
      ]
        ?.toString()
        .trim()
        .toUpperCase();

      const aidat = Number(
        row["Aidat"]
      );

      const status =
        normalizeStatus(
          row["Durum"]
        );

      // VALIDATION
      if (
        !month ||
        !year ||
        !daire_no
      ) {
        continue;
      }

      const daire_type =
        getDaireType(
          daire_no
        );

      // EXISTING
      const existing =
        await prisma.dues.findFirst({
          where: {
            daire_no,
            year,
            month,
          },
        });

      if (existing) {
        await prisma.dues.update({
          where: {
            id: existing.id,
          },

          data: {
            aidat,
            status,
            daire_type,
          },
        });

        updated++;

      } else {
        await prisma.dues.create({
          data: {
            daire_no,
            daire_type,
            year,
            month,
            aidat,
            status,
          },
        });

        created++;
      }
    }

    return Response.json({
      success: true,

      total: rows.length,

      created,

      updated,
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          "Excel import başarısız",
      },
      {
        status: 500,
      }
    );
  }
}