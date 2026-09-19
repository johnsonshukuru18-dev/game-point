import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/home",
  "/profile",
  "/battles",
  "/messages",
  "/notifications",
  "/players",
  "/admin",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("gp_session")?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/profile/:path*", "/battles/:path*", "/messages/:path*", "/notifications/:path*", "/players/:path*", "/admin/:path*"],
};