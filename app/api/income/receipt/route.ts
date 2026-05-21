import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DAIRELER = [
  ...Array.from({ length: 16 }, (_, i) => ({ no: String(i + 1), type: "normal" as const })),
  { no: "17", type: "dublex" as const },
  { no: "18", type: "dublex" as const },
  { no: "K",  type: "kapici" as const },
];

export async function POST(req: NextRequest) {
  const { year, month, normal_dogalgaz, dublex_dogalgaz, kapici_dogalgaz, aidat } = await req.json();

  if (!year || !month) {
    return NextResponse.json({ success: false, error: "Yıl ve ay zorunludur" }, { status: 400 });
  }

  const dogalgazMap: Record<string, number> = {
    normal: normal_dogalgaz,
    dublex: dublex_dogalgaz,
    kapici: kapici_dogalgaz,
  };

  await Promise.all(
    DAIRELER.map(daire => {
      const dogalgaz = dogalgazMap[daire.type] || 0;
      const total    = dogalgaz + (aidat || 0);

      return prisma.income.upsert({
        where: {
          daire_no_year_month: { daire_no: daire.no, year, month },
        },
        update: { dogalgaz, aidat: aidat || 0, total },
        create: {
          daire_no:   daire.no,
          daire_type: daire.type,
          year,
          month,
          dogalgaz,
          aidat:      aidat || 0,
          total,
          status:     "PENDING",
        },
      });
    })
  );

  return NextResponse.json({ success: true, created: DAIRELER.length });
}