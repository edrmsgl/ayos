import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("token"); // ✅ userId değil token sil
  return Response.json({ success: true });
}