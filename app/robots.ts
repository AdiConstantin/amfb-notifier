import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://amfb.adrianconstantin.ro';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/subscribe', '/api/unsubscribe', '/api/cron'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}