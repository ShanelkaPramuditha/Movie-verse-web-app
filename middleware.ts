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
    const path = req.nextUrl.pathname;

    // Check if user is admin (role: 'admin')
    const isAdmin = token?.role === "admin";

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
    // Create response with security headers
    const response = NextResponse.next();

    // HSTS Header (only for production HTTPS)
    if (process.env.NODE_ENV === "production") {
      response.headers.set(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload"
      );
    }

    // Security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()"
    );
    response.headers.set("X-DNS-Prefetch-Control", "off");
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    // Modified frame options to allow YouTube embeds
    response.headers.set("X-Frame-Options", "SAMEORIGIN");

    // Additional security headers
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Resource-Policy", "cross-origin");

    // Content Security Policy to prevent XSS and other attacks
    const cspHeader = `
      default-src 'self';
      script-src 'self' ${
        process.env.NODE_ENV === "production" ? "" : "'unsafe-eval'"
      } 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: blob: https://image.tmdb.org https://lh3.googleusercontent.com https://img.youtube.com https://i.ytimg.com;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://api.themoviedb.org https://vercel.live https://vitals.vercel-insights.com https://www.youtube.com https://youtube.com;
      media-src 'self' https://www.youtube.com https://youtube.com;
      frame-src 'self' https://www.youtube.com https://youtube.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'self';
      upgrade-insecure-requests;
    `
      .replace(/\s{2,}/g, " ")
      .trim();

    response.headers.set("Content-Security-Policy", cspHeader);

    // Protect admin routes
    if (path.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (path.startsWith("/dashboard") && !token) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/:path*",
    "/movies/:path*",
  ],
};
