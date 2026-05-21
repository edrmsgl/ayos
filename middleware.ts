import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const publicRoutes = ["/login", "/register"];

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  const { pathname } = request.nextUrl;

  const isPublic = publicRoutes.some(route =>
    pathname.startsWith(route)
  );

  // LOGIN olmuş kullanıcı login sayfasına girmesin
  if (isPublic && token) {
    try {
      await jwtVerify(token, SECRET);

      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );

    } catch {
      const response = NextResponse.next();

      response.cookies.delete("token");

      return response;
    }
  }

  // PRIVATE ROUTES
  if (!isPublic) {
    if (!token) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }

    try {
      await jwtVerify(token, SECRET);

    } catch {
      const response = NextResponse.redirect(
        new URL("/login", request.url)
      );

      response.cookies.delete("token");

      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};