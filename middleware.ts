import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const publicRoutes = ["/login", "/register"];
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isPublic = publicRoutes.some(route => pathname.startsWith(route));

  // Token varsa login/register'a gitmesin
  if (isPublic && token) {
    try {
      await jwtVerify(token, SECRET);
      return NextResponse.redirect(new URL("/profile", request.url));
    } catch {
      // token geçersizse devam et
    }
  }

  if (!isPublic) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
      await jwtVerify(token, SECRET);
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};