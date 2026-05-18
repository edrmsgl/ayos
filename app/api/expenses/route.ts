import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = await verifyToken(token || "");
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const expenses = await prisma.expenses.findMany({
    include: { category: true, user: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });
  return Response.json({ expenses });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = await verifyToken(token || "");
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { category_id, amount, date, description, supplier, payment_method, period, status, invoice_no } = await req.json();

    const expense = await prisma.expenses.create({
      data: {
        user_id: payload.userId,
        category_id: Number(category_id),
        amount,
        date: new Date(date),
        description,
        supplier,
        payment_method,
        period,
        status: status || "PENDING",
        invoice_no
      },
    });
    return Response.json({ success: true, expense });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}