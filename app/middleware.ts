import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token");

  const isLoginPage = req.nextUrl.pathname === "/login";

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/income/:path*",
    "/expenses/:path*",
    "/dues/:path*",
    "/apartments/:path*",
    "/users/:path*",
    "/residents/:path*",
    "/tasks/:path*",
    "/announcements/:path*",
    "/login",
  ],
};