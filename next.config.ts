import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

// Bundle analyzer - run with ANALYZE=true npm run build
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config: NextConfig) => config;

const nextConfig: NextConfig = {
  // Security + Cache headers
  async headers() {
    return [
      {
        // Security headers for all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.sentry.io https://*.vercel-scripts.com https://va.vercel-scripts.com https://*.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com https://api.qrserver.com https://*.google-analytics.com https://*.googletagmanager.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.openai.com https://generativelanguage.googleapis.com https://*.livekit.cloud wss://*.livekit.cloud https://api.resend.com https://*.sentry.io https://*.vercel-analytics.com https://vitals.vercel-insights.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
              "frame-src 'self' blob: https://js.stripe.com https://*.supabase.co",
              "media-src 'self' blob:",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
      {
        // Prevent caching of HTML pages — always fetch fresh from server
        source: '/((?!_next/static|_next/image|.*\\.(?:js|css|woff2?|ttf|eot|png|jpg|jpeg|gif|webp|avif|svg|ico)$).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        // PWA Manifest — correct Content-Type for Yandex/Android standalone mode
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        // Service worker — never cache (browsers check for byte-diff automatically)
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },

  // Generate a unique version ID at build time for auto-update detection
  env: {
    NEXT_PUBLIC_APP_VERSION: new Date().getTime().toString(),
  },
  // Allow IDE preview origins (Windsurf/Cascade)
  // @ts-ignore - Next.js 15.5+ supports this but types may be outdated
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  

  outputFileTracingRoot: path.join(__dirname),
  trailingSlash: false, // Ensure URL consistency across all devices
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jbxveulddoznswyeihda.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'upwctgdpuckreoquofiu.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console.log in production (keep errors and warnings)
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn'] } 
      : false,
  },
  
  experimental: {
    serverActions: {
      // Increase payload limit to 50MB for high-res vision analysis
      bodySizeLimit: '50mb',
      // Allowed origins for Server Actions (localhost + production)
      allowedOrigins: [
        'localhost:3000', 
        '127.0.0.1:3000', 
        '127.0.0.1:50830', 
        '127.0.0.1:50831', 
        '127.0.0.1:50832',
        'elektrosmart-pro.vercel.app',
        'elektrosmart.pro',
        'www.elektrosmart.pro',
      ],
    },
    // Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@radix-ui/react-icons',
    ],
  },
  
  // Add cache busting for development
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "elektrosmartpro",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
