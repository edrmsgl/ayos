import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = await verifyToken(token || "");
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const users = await prisma.users.findMany({
      select: { id: true, email: true, name: true, phone: true, role: true, apartmentNumber: true },
      orderBy: { id: "desc" },
    });
    return Response.json({ users });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = await verifyToken(token || "");
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { email, password, name, phone, role, apartmentNumber } = await req.json();

  if (!email || !password) {
    return Response.json({ error: "Email ve şifre zorunlu" }, { status: 400 });
  }

  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) return Response.json({ error: "Bu email zaten kayıtlı" }, { status: 400 });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.users.create({
    data: { email, passwordHash: hashedPassword, name, phone, role: role || "RESIDENT", apartmentNumber },
  });

  return Response.json({ success: true, user });
}