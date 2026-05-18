import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = await verifyToken(token || "");
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [monthly, yearly, byCategory] = await Promise.all([
    prisma.expenses.aggregate({
      where: { date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.expenses.aggregate({
      where: { date: { gte: startOfYear } },
      _sum: { amount: true },
    }),
    prisma.expenses.groupBy({
      by: ["category_id"],
      where: { date: { gte: startOfYear } },
      _sum: { amount: true },
    }),
  ]);

  return Response.json({
    monthly: monthly._sum.amount || 0,
    yearly: yearly._sum.amount || 0,
    byCategory,
  });
}