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

    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, name: true, phone: true }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return Response.json(
        { error: "Email veya şifre hatalı" },
        { status: 401 }
      );
    }

    const token = await signToken({ userId: user.id });
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
    });

    const profileComplete = !!(user.name && user.phone);

    return Response.json({
      success: true,
      redirect: profileComplete ? "/dashboard" : "/profile"
    });

  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}