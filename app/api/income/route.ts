import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year  = parseInt(searchParams.get("year")  || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

  const gelirler = await prisma.income.findMany({
    where: { year, month },
    orderBy: [{ daire_type: "asc" }, { daire_no: "asc" }],
  });

  return NextResponse.json({ success: true, gelirler });
}