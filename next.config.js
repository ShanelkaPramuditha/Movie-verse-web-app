/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false, // Remove X-Powered-By header for security
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    domains: [
      "image.tmdb.org",
      "lh3.googleusercontent.com",
      "avatars.githubusercontent.com",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
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
              .trim(),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;