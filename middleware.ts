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

    // Strict-Transport-Security Header - Fix HSTS Missing
    const isProduction = process.env.NODE_ENV === "production";
    const isHTTPS = req.nextUrl.protocol === "https:";
    
    if (isProduction || isHTTPS) {
      response.headers.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
      );
    }

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

    // Content Security Policy to prevent XSS and other attacks
    const cspHeader = `
      default-src 'self';
      script-src 'self' ${
        process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""
      } 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: blob: https://image.tmdb.org https://lh3.googleusercontent.com https://avatars.githubusercontent.com;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://api.themoviedb.org https://vercel.live https://vitals.vercel-insights.com;
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
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/:path*",
    "/movies/:path*",
  ],
};
