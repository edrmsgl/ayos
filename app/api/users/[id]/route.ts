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
    const { name, phone, role, apartmentNumber } = await req.json();

    const user = await prisma.users.update({
      where: { id: Number(id) },
      data: { name, phone, role, apartmentNumber },
    });

    return Response.json({ success: true, user });
  } catch (error) {
    console.error("PUT /api/users error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}