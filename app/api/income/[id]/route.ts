import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { status } = await req.json();
  const id = parseInt(params.id);

  if (!["PAID", "PENDING", "WAIVED"].includes(status)) {
    return NextResponse.json({ success: false, error: "Geçersiz durum" }, { status: 400 });
  }

  const gelir = await prisma.income.update({
    where: { id },
    data:  { status },
  });

  return NextResponse.json({ success: true, gelir });
}
