import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Standard ES modules setup for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://indiianews.in';
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');

// Helper to slugify URL friendly titles exactly as in src/utils/slugify.js
const getUrlFriendlyTitle = (title) => {
  if (!title) return '';
  return title.replace(/\//g, '-').trim();
};

// Fetch documents helper using Google Firestore REST API
const fetchFirestoreDocuments = (collectionName) => {
  return new Promise((resolve, reject) => {
    const url = `https://firestore.googleapis.com/v1/projects/news-app-58b71/databases/(default)/documents/${collectionName}?pageSize=1000`;
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => { chunks.push(chunk); });
      res.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          const parsed = JSON.parse(buffer.toString('utf8'));
          resolve(parsed.documents || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

async function generate() {
  console.log('Generating sitemap.xml and robots.txt...');
  
  const urls = [
    { loc: `${BASE_URL}/`, changefreq: 'daily', priority: '1.0' }
  ];

  try {
    // 1. Fetch categories
    console.log('Fetching active categories from Firestore...');
    const categories = await fetchFirestoreDocuments('categories');
    let categoriesCount = 0;
    categories.forEach(doc => {
      const fields = doc.fields || {};
      const status = fields.status?.booleanValue;
      if (status === true) {
        const id = doc.name.split('/').pop();
        urls.push({
          loc: `${BASE_URL}/category/${id}`,
          changefreq: 'daily',
          priority: '0.8'
        });
        categoriesCount++;
      }
    });
    console.log(`Added ${categoriesCount} categories to sitemap.`);
  } catch (err) {
    console.error('Warning: Failed to fetch categories for sitemap:', err.message);
  }

  try {
    // 2. Fetch news articles
    console.log('Fetching news articles from Firestore...');
    const news = await fetchFirestoreDocuments('news');
    let newsCount = 0;
    news.forEach(doc => {
      const fields = doc.fields || {};
      const title = fields.title?.stringValue;
      if (title) {
        const slug = getUrlFriendlyTitle(title);
        urls.push({
          loc: `${BASE_URL}/news/${encodeURIComponent(slug)}`,
          changefreq: 'weekly',
          priority: '0.6'
        });
        newsCount++;
      }
    });
    console.log(`Added ${newsCount} news articles to sitemap.`);
  } catch (err) {
    console.error('Warning: Failed to fetch news articles for sitemap:', err.message);
  }

  // 3. Build XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  xml += '</urlset>\n';

  // Make sure public directory exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  // Write sitemap.xml
  const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`Successfully generated sitemap.xml at: ${sitemapPath}`);

  // 4. Build and write robots.txt
  const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /
Allow: /category/
Allow: /news/
Disallow: /admin/
Disallow: /admin/*

Sitemap: ${BASE_URL}/sitemap.xml
`;

  const robotsPath = path.join(PUBLIC_DIR, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxt, 'utf8');
  console.log(`Successfully generated robots.txt at: ${robotsPath}`);
}

generate();
