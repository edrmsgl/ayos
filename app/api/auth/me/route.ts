import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return Response.json({ error: "Geçersiz token" }, { status: 401 });
  }

  return Response.json({ 
    user: { 
      id: payload.userId,
      loginTime: payload.loginTime
    } 
  });
}