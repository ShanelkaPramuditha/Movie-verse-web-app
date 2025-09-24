import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

type RateLimitRecord = {
  count: number;
  lastRequest: number;
};

const RATE_LIMIT = 100;
const WINDOW_MS = 60 * 1000;
const ipStore: Record<string, RateLimitRecord> = {};

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === "admin";
    const path = req.nextUrl.pathname;

    // -------- RATE LIMITER --------
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const now = Date.now();
    const record = ipStore[ip];

    if (record) {
      if (now - record.lastRequest < WINDOW_MS) {
        record.count += 1;
      } else {
        record.count = 1;
        record.lastRequest = now;
      }
    } else {
      ipStore[ip] = { count: 1, lastRequest: now };
    }

    if (ipStore[ip].count > RATE_LIMIT) {
      return new NextResponse(
        JSON.stringify({ message: "Too many requests, try again later." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // -------- AUTH ROUTES --------
    if (path.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (path.startsWith("/dashboard") && !token) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
