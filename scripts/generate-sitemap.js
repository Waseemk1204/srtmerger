import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_POSTS_PATH = path.join(__dirname, '../src/data/blogPosts.ts');
const SITEMAP_PATH = path.join(__dirname, '../public/sitemap.xml');
const BASE_URL = 'https://srtmerger.com';

const STATIC_ROUTES = [
    { path: '', changefreq: 'weekly', priority: '1.0' },
    { path: '/how-it-works', changefreq: 'monthly', priority: '0.8' },
    { path: '/blog', changefreq: 'weekly', priority: '0.8' },
    { path: '/privacy', changefreq: 'yearly', priority: '0.5' },
];

function getBlogIds() {
    const content = fs.readFileSync(BLOG_POSTS_PATH, 'utf-8');
    const ids = [];
    const regex = /id:\s*['"]([^'"]+)['"]/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        ids.push(match[1]);
    }
    return ids;
}

function generateSitemap() {
    const blogIds = getBlogIds();
    const today = new Date().toISOString().split('T')[0];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static routes
    STATIC_ROUTES.forEach(route => {
        xml += '  <url>\n';
        xml += `    <loc>${BASE_URL}${route.path}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
        xml += `    <priority>${route.priority}</priority>\n`;
        xml += '  </url>\n';
    });

    // Blog posts
    blogIds.forEach(id => {
        xml += '  <url>\n';
        xml += `    <loc>${BASE_URL}/blog/${id}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += '    <changefreq>monthly</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
    });

    xml += '</urlset>';

    fs.writeFileSync(SITEMAP_PATH, xml);
    console.log(`Sitemap generated with ${STATIC_ROUTES.length} static routes and ${blogIds.length} blog posts.`);
}

generateSitemap();
