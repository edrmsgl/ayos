import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = await verifyToken(token || "");
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = Number((await context.params).id); // ✅
    const { name, icon } = await req.json();

    console.log("Updating category id:", id);

    const category = await prisma.expense_categories.update({
      where: { id },
      data: { name, icon: icon || null },
    });
    return Response.json({ success: true, category });
  } catch (error) {
    console.error("PUT category error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = await verifyToken(token || "");
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = Number((await context.params).id);
    await prisma.expense_categories.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE category error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}