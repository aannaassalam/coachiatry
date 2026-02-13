import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token; // contains session JWT payload
    const frontendExpired =
      typeof token?.frontendExpiresAt === "number" &&
      Date.now() >= token.frontendExpiresAt;
    const hasFrontendSession = !!token?.token && !frontendExpired;

    // 1️⃣ Not logged in → redirect to login
    if (!hasFrontendSession && !pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // 2️⃣ Logged in but visiting /auth/* → redirect to home
    if (hasFrontendSession && pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // 3️⃣ Role-based access control: only "coach" can access /clients/*
    if (pathname.startsWith("/clients")) {
      const role = token?.user?.role || token?.role; // adapt based on how you store it in jwt callback
      if (role === "user") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // ✅ Default allow
    return NextResponse.next();
  },
  {
    callbacks: {
      // Always run middleware; manual logic handles auth checks
      authorized: () => true
    }
  }
);

// 4️⃣ Exclude static assets, API routes, and public pages
export const config = {
  matcher: ["/((?!_next|api|assets|static|favicon.ico|share).*)"]
};
