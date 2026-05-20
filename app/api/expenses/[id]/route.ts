import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = await verifyToken(token || "");
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { category_id, amount, date, description, supplier, payment_method, period, status, invoice_no } = await req.json();

    const expense = await prisma.expenses.update({
      where: { id: Number(id) },
      data: {
        category_id: Number(category_id),
        amount,
        date: new Date(date),
        description,
        supplier,
        payment_method,
        period,
        status,
        invoice_no
      },
    });
    return Response.json({ success: true, expense });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}