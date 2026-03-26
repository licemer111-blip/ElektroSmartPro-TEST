/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://elektrosmart.pro',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: [
    '/dashboard',
    '/dashboard/*',
    '/admin',
    '/admin/*',
    '/api/*',
    '/auth/*',
    '/server-sitemap.xml',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/admin', '/api', '/auth'],
      },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://elektrosmart.pro'}/sitemap.xml`,
    ],
  },
  additionalPaths: async (config) => [
    await config.transform(config, '/'),
    await config.transform(config, '/#features'),
    await config.transform(config, '/#pricing'),
  ],
};
