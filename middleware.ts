import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === "admin";
    const isUser = token?.role === "user";
    const path = req.nextUrl.pathname;

    // Create response with security headers
    const response = NextResponse.next();

    // Add security headers to prevent data leakage
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    // Anti-clickjacking headers
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Resource-Policy", "cross-origin");
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()"
    );

    // Content Security Policy to prevent XSS and other attacks
    const cspHeader = `
      default-src 'self';
      script-src 'self' ${
        process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""
      } https://vercel.live https://va.vercel-scripts.com https://www.google.com https://fonts.googleapis.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: blob: https: http:;
      font-src 'self' https://fonts.gstatic.com data:;
      connect-src 'self' https://api.themoviedb.org https://vercel.live https://vitals.vercel-insights.com https://www.google.com;
      media-src 'self' https://www.youtube.com https://youtube.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `
      .replace(/\s{2,}/g, " ")
      .trim();

    response.headers.set("Content-Security-Policy", cspHeader);

    // Protect admin routes
    if (path.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect user routes
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
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
