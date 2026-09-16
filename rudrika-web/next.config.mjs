/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Images are served from this app's own /public/uploads folder.
    // Next.js resizes them and serves modern formats — big speed win.
    //
    // WebP only, deliberately. AVIF files are ~20% smaller, but encoding one
    // takes 10-20x longer than WebP, and this box has two cores that are also
    // serving the shop. The first person to view a photo was paying for that
    // encode in wait time — which is why switching to a colour nobody had
    // opened yet took seconds. Uploads are already WebP at quality 82 and
    // capped at 2000px, so there was very little left for AVIF to win anyway.
    formats: ["image/webp"],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1600],
    imageSizes: [64, 96, 128, 200, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Allow remote images too, in case any are hosted elsewhere later
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  async headers() {
    return [
      {
        // Uploaded media never changes once written — cache it hard
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:path*(png|jpg|jpeg|webp|avif|svg|mp4|webm)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },

  // Old Shopify URLs keep working after the domain moves. Product handles are
  // unchanged, so /products/<handle> resolves as-is.
  async redirects() {
    return [
      { source: "/collections/all", destination: "/products", permanent: true },
      { source: "/products/untitled-31aug_09-31-40", destination: "/products/silk-linen-sarees-tulip-style-floral-motifs", permanent: true },
      { source: "/products/untitled-31aug_13-19-12", destination: "/products/soft-bengal-cotton-handloom-saree", permanent: true },
      { source: "/products/untitled-1sept_16-20-39", destination: "/products/tussar-ghicha-silk-madhubani-style-silk-mark-certificate", permanent: true },
      { source: "/blogs/styled-by-rudrika/:slug", destination: "/letters/:slug", permanent: true },
      { source: "/blogs/styled-by-rudrika", destination: "/letters", permanent: true },
      { source: "/blogs/:blog/:slug", destination: "/letters/:slug", permanent: true },
      { source: "/pages/faq-1", destination: "/faq", permanent: true },
      { source: "/pages/faq", destination: "/faq", permanent: true },
      { source: "/pages/contact", destination: "/contact", permanent: true },
      { source: "/pages/about", destination: "/about", permanent: true },
      { source: "/pages/styled-by-rudrika", destination: "/p/styling", permanent: true },
      { source: "/policies/shipping-policy", destination: "/shipping-policy", permanent: true },
      { source: "/policies/refund-policy", destination: "/returns", permanent: true },
      { source: "/policies/privacy-policy", destination: "/privacy-policy", permanent: true },
      { source: "/policies/terms-of-service", destination: "/terms", permanent: true },
      { source: "/account/login", destination: "/login", permanent: true },
      { source: "/account/register", destination: "/register", permanent: true },
    ];
  },

  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
