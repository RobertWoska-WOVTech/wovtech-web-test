
import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const routes = JSON.parse(fs.readFileSync(path.join(root, 'build', 'routes.json'), 'utf8'));
const langs = ['sk', 'cs', 'en'];
const host = 'https://wovtech.sk';

function loadLang(lang){
  return JSON.parse(fs.readFileSync(path.join(root, 'i18n', `${lang}.json`), 'utf8'));
}

function ensureDir(filePath){
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function localPath(route){
  let p = route.replace(/^\//,'');
  if (!p || route.endsWith('/')) p = path.join(p, 'index.html');
  return p;
}

function replaceTokens(html, lang){
  return html.replace(/\{\{route:([a-zA-Z0-9_]+)\}\}/g, (_, key) => {
    if (!routes[key]) throw new Error(`Unknown route key: ${key}`);
    return routes[key][lang];
  });
}

function absoluteUrl(route){
  return route === '/' ? host + '/' : host + route;
}

function renderHeader(site, lang){
  return `
<header class="header">
  <div class="container">
    <nav class="nav" aria-label="${lang === 'en' ? 'Main navigation' : 'Hlavná navigácia'}">
      <a class="brand" href="${routes.home[lang]}">
        <img class="brand-logo" src="${lang === 'sk' ? '/assets/img/logo-mark.png' : lang === 'cs' ? '/assets/img/logo-mark.png' : '/assets/img/logo-mark.png'}" alt="${site.brandName} logo" width="36" height="36" loading="lazy" />
        <span>${site.brandName}<span class="sub">${site.tagline}</span></span>
      </a>
      <div class="menu">
        <a href="${routes.infra_design[lang]}">${site.nav.infra}</a>
        <a href="${routes.services[lang]}">${site.nav.services}</a>
        <a href="${routes.articles[lang]}">${site.nav.articles}</a>
        <a class="cta" href="${routes.contact[lang]}">${site.nav.contact}</a>
      </div>
    </nav>
  </div>
</header>`;
}

function renderFooter(site, lang){
  return `
<footer class="footer">
  <div class="container footer-grid">
    <div>
      <div class="brand" style="margin-bottom:10px">
        <img class="brand-logo" src="/assets/img/logo-mark.png" alt="${site.brandName} logo" width="36" height="36" loading="lazy" />
        <span>${site.companyName}<span class="sub">${site.tagline}</span></span>
      </div>
      <small>${site.copyright}</small>
      <div style="margin-top:8px; display:flex; gap:10px; flex-wrap:wrap">
        <a href="${routes.privacy[lang]}">${site.footer.privacy}</a>
        <a href="${routes.terms[lang]}">${site.footer.terms}</a>
      </div>
    </div>
  </div>
</footer>`;
}

function hreflangLinks(pageKey){
  let out = '';
  for (const lang of langs){
    out += `\n  <link rel="alternate" hreflang="${lang}" href="${absoluteUrl(routes[pageKey][lang])}" />`;
  }
  out += `\n  <link rel="alternate" hreflang="x-default" href="${absoluteUrl(routes[pageKey].sk)}" />`;
  return out;
}

function renderPage({site, pageKey, page, lang}){
  const pageUrl = absoluteUrl(routes[pageKey][lang]);
  const body = replaceTokens(page.body, lang);
  return `<!doctype html>
<html lang="${site.lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${page.meta.title}</title>
  <meta name="description" content="${page.meta.description}" />
  <meta name="robots" content="index,follow,noarchive" />
  <link rel="canonical" href="${pageUrl}" />${hreflangLinks(pageKey)}
  <meta property="og:title" content="${page.meta.title}" />
  <meta property="og:description" content="${page.meta.description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:locale" content="${site.locale}" />
  <meta name="theme-color" content="#0b1220" />
  <link rel="stylesheet" href="/assets/css/styles.css" />
</head>
<body>
  <a class="skip-link" href="#content">${site.skip}</a>
  ${renderHeader(site, lang)}
  <main id="content">${body}</main>
  ${renderFooter(site, lang)}
  <script type="application/ld+json">${JSON.stringify({
    "@context":"https://schema.org",
    "@type":"Organization",
    "name":site.companyName,
    "url":host,
    "email":site.email,
    "telephone":site.phone,
    "areaServed":["SK","CZ","EN"],
    "description":site.orgDescription
  })}</script>
</body>
</html>`;
}

function generateSitemap(){
  const pageKeys = Object.keys(routes).filter(k => k !== 'not_found');
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const key of pageKeys){
    for (const lang of langs){
      xml += `  <url><loc>${absoluteUrl(routes[key][lang])}</loc><lastmod>2026-03-18</lastmod></url>\n`;
    }
  }
  xml += `</urlset>\n`;
  return xml;
}

function cleanDist(){
  const dist = path.join(root, 'dist');
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });
}

function copyAssets(){
  fs.cpSync(path.join(root, 'assets'), path.join(root, 'dist', 'assets'), { recursive: true });
}

function main(){
  cleanDist();
  copyAssets();
  for (const lang of langs){
    const data = loadLang(lang);
    for (const [pageKey, page] of Object.entries(data.pages)){
      const route = routes[pageKey][lang];
      const outPath = path.join(root, 'dist', localPath(route));
      ensureDir(outPath);
      fs.writeFileSync(outPath, renderPage({site:data.site, pageKey, page, lang}), 'utf8');
    }
  }
  fs.writeFileSync(path.join(root, 'dist', 'sitemap.xml'), generateSitemap(), 'utf8');
}

main();
