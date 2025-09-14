import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    // If user is not logged in, allow only /auth/* routes
    if (!req.nextauth.token && !pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // If user is logged in and tries to access /auth/*, redirect to home (optional)
    if (req.nextauth.token && pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Apply withAuth to all routes
      authorized: () => true
    }
  }
);

export const config = {
  matcher: ["/((?!_next|api|assets|static|favicon.ico).*)"] // protect everything except static + API
};
