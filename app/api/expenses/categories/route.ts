import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = await verifyToken(token || "");
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.expense_categories.findMany({
    orderBy: { name: "asc" },
  });
  return Response.json({ categories });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = await verifyToken(token || "");
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, icon } = await req.json();
    if (!name) return Response.json({ error: "Kategori adı zorunlu" }, { status: 400 });

    const category = await prisma.expense_categories.create({
      data: { name, icon },
    });
    return Response.json({ success: true, category });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}