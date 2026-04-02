import { NextResponse, type NextRequest } from "next/server";
import { HOUSEHOLD_CODE_COOKIE } from "@/lib/household";

function isValidCode(value: string | undefined): boolean {
  return value !== undefined && /^\d{6}$/.test(value);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  const isProtected =
    pathname === "/" ||
    pathname.startsWith("/record") ||
    pathname.startsWith("/stats") ||
    pathname.startsWith("/members");

  if (!isProtected) {
    return NextResponse.next();
  }

  const code = request.cookies.get(HOUSEHOLD_CODE_COOKIE)?.value;
  if (!isValidCode(code)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/record", "/stats", "/members", "/login"],
};
