import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email ve şifre zorunlu" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return Response.json(
        { error: "Bu email zaten kayıtlı" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: "RESIDENT",
      },
    });

    const token = await signToken({ userId: user.id });
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
    });

    return Response.json({ success: true, id: user.id });

  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}