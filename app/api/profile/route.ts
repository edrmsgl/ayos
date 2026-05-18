import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = await verifyToken(token || "");

  if (!payload) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.users.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, phone: true },
  });

  return Response.json({ profile });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = await verifyToken(token || "");

  if (!payload) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, phone } = await req.json();

    const user = await prisma.users.update({
      where: { id: payload.userId }, // ✅ body'den değil token'dan
      data: { name, phone },
    });

    return Response.json({ success: true, user });

  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}