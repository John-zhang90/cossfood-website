const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const cpanelPath = path.join(root, '.cpanel.yml');
const apiPath = path.join(root, 'api', 'save-inquiry.php');
const visitorApiPath = path.join(root, 'api', 'visitor-stats.php');
const pagesWorkflowPath = path.join(root, '.github', 'workflows', 'static.yml');
const html = fs.readFileSync(indexPath, 'utf8');
const cpanel = fs.readFileSync(cpanelPath, 'utf8');
const api = fs.readFileSync(apiPath, 'utf8');
const visitorApi = fs.readFileSync(visitorApiPath, 'utf8');
const pagesWorkflow = fs.readFileSync(pagesWorkflowPath, 'utf8');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

assert(html.includes('data-i18n="navContact"'), 'Header WhatsApp contact is missing');
assert(html.includes('image/logo-about.svg'), 'About section must use the redrawn vector logo');
assert(fs.existsSync(path.join(root, 'image/logo-about.svg')), 'About vector logo asset is missing');
assert(html.includes('height: min(320px, calc(100vh - 78px))'), 'Hero section is still too tall on desktop');
assert(html.includes('object-fit: contain; object-position: center'), 'Hero logo is not fitted without grey cropping margins');
assert(html.includes('image/logo-hero.svg'), 'Hero vector logo is missing');
assert(html.includes('.hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)'), 'Hero cards must be two equal-width columns');
assert(html.includes('margin: 24px 30px; border-radius: 40px; overflow: hidden;'), 'Hero right card must use the same rounded plate form as the logo');
assert(html.includes('.about-img { flex: 1; min-width: 0; height: auto; padding: 0; border-radius: 40px'), 'About plate must be a rounded card without an extra white frame');
assert(html.includes('grid-template-columns: 220px minmax(0, 1fr)'), 'Desktop catalog sidebar is missing');
assert(html.includes('.category-list { display: flex; flex-wrap: nowrap; gap: 8px; overflow-x: auto'), 'Mobile category browser is not horizontally scrollable');
assert(html.includes('.product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }'), 'Mobile product grid is not optimized for two-column browsing');
assert(html.includes('data-i18n="categorySidebarTitle"'), 'Catalog sidebar title is missing');
assert(html.includes('data-i18n="processTitle"'), 'Three-step enquiry section is missing');
assert(html.includes('class="process-grid"'), 'Three-step enquiry layout is missing');
assert(html.includes('data-i18n="process1Title">填写信息'), 'Step one must collect customer information');
assert(html.includes('id="open-enquiry-modal"'), 'Step one enquiry button is missing');
assert(html.includes('id="enquiry-modal"'), 'Customer information modal is missing');
for (const field of ['name', 'address', 'phone', 'deliverySlot']) {
    assert(html.includes(`name="${field}"`), `Enquiry form field is missing: ${field}`);
}
assert(html.includes('value="早车（09:00–17:00）"'), 'Morning delivery option is missing');
assert(html.includes('value="晚车（17:00–21:00）"'), 'Evening delivery option is missing');
assert(html.includes("const enquiryApiUrl"), 'Enquiry API URL is missing');
assert(html.includes('id="visitor-total"'), 'Total visitor counter is missing from the footer');
assert(html.includes('id="visitor-today"'), 'Daily visitor counter is missing from the footer');
assert(html.includes("const visitorStatsUrl"), 'Visitor statistics API URL is missing');
assert(!fs.existsSync(path.join(root, '.github', 'workflows', 'pages.yml')), 'Legacy Pages workflow must be removed so only the prepared _site is published');
assert(pagesWorkflow.includes('branches: ["main"]'), 'GitHub Pages must deploy from the single main branch');
assert(html.includes('setInterval(recordVisit, 300000)'), 'Visitor statistics should refresh every 5 minutes to limit server writes');
assert(html.includes("en: 'Fried Egg Noodle 1.5kg'"), 'N005 pack size must match the package label (1.5kg)');
assert(!html.includes('Fried Egg Noodle 3kg'), 'N005 still shows the wrong 3kg pack size');
assert((html.match(/\.category-btn\.active, \.category-btn:hover/g) || []).length === 1, 'Duplicate category button CSS rule found');
assert((html.match(/\+65 8756 9015/g) || []).length >= 6, 'New Singapore phone number is not shown in all required contact copy');
assert(!html.includes('6773 3116'), 'Old displayed phone number is still present');
assert(!html.includes('6567733116'), 'Old phone or WhatsApp target is still present');
assert(html.includes('https://wa.me/6587569015'), 'WhatsApp links do not use the new phone number');
assert(html.includes('href="tel:+6587569015"'), 'Phone link does not use the new phone number');
assert(html.includes('const wechatQrUrl = \'image/WeChat_QRcode-transparent.png\';'), 'Transparent WeChat QR URL constant is missing');
assert(html.includes('href="${wechatQrUrl}"'), 'Red product contact buttons do not use the WeChat QR code');
assert(!html.includes('<a class="call" href="tel:'), 'Red product contact buttons still dial the phone directly');
assert(html.includes('image/WeChat_QRcode-transparent.png'), 'Transparent WeChat QR code is not referenced');
assert(html.includes('image/WhatsApp_QRcode-transparent.png'), 'Transparent WhatsApp QR code is not referenced');
assert(html.includes('data-i18n="footerQrTitle"'), 'Footer QR section title is missing');
assert(html.includes('data-i18n-alt="wechatQrAlt"'), 'WeChat QR alt translation hook is missing');
assert(html.includes('data-i18n-alt="whatsappQrAlt"'), 'WhatsApp QR alt translation hook is missing');
assert(html.includes('background: #f1dfc7'), 'Footer QR cards are missing the softer brand background');
assert(html.includes('border-radius: 10px'), 'Footer QR cards are missing rounded corners');
assert(cpanel.includes('export DEPLOYPATH=/home/cossfood/public_html/'), 'cPanel deployment path is incorrect');
assert(cpanel.includes('/bin/cp index.html $DEPLOYPATH'), 'cPanel deployment does not copy index.html');
assert(cpanel.includes('/bin/cp -R image $DEPLOYPATH'), 'cPanel deployment does not copy the image directory');
assert(cpanel.includes('rm -f $DEPLOYPATH/image/optimized/*.7z'), 'cPanel deployment must exclude the local image archive');
assert(cpanel.includes('/bin/cp api/save-inquiry.php $DEPLOYPATH/save-inquiry.php'), 'cPanel deployment does not copy the enquiry API to the public site root');
assert(cpanel.includes('/bin/cp api/visitor-stats.php $DEPLOYPATH/visitor-stats.php'), 'cPanel deployment does not copy the visitor statistics API');

assert(fs.existsSync(apiPath), 'Enquiry API file is missing');
assert(api.includes("'customer-inquiries.csv'"), 'Customer inquiry CSV storage is missing');
assert(api.includes("'customer-inquiries.xlsx'"), 'Native Excel storage path is missing');
assert(api.includes("['序号', '名字', '地址', '电话', '配送时间段', '时间']"), 'Customer information columns are incomplete');
assert(api.includes("dirname(__DIR__)"), 'Customer data must be stored outside public_html');
assert(api.includes('flock($lock, LOCK_EX)'), 'Customer storage must use a write lock');
assert(api.includes('ZipArchive'), 'API should create a native Excel copy when available');
assert(fs.existsSync(visitorApiPath), 'Visitor statistics API file is missing');
assert(visitorApi.includes("'visitor-stats.csv'"), 'Visitor CSV report storage is missing');
assert(visitorApi.includes("'visitor-stats.xlsx'"), 'Visitor Excel report storage is missing');
assert(visitorApi.includes("['日期', '当日访问人数', '累计访问人数', '最后更新时间']"), 'Visitor report columns are incomplete');
assert(visitorApi.includes("hash('sha256'"), 'Visitor identity must be anonymized');
assert(visitorApi.includes('$storedTodayCount'), 'Stored daily count must be compared before rewriting the visitor report');
assert(visitorApi.includes('$needsReportWrite'), 'Visitor reports must only be rewritten when the daily count changes');
assert(visitorApi.includes('flock($lock, LOCK_EX)'), 'Visitor storage must use a write lock');
assert(pagesWorkflow.includes('git push --force'), 'GitHub Actions must publish the site to the gh-pages branch');
assert(pagesWorkflow.includes('gh-pages'), 'GitHub Actions must publish to the gh-pages branch');
assert(pagesWorkflow.includes('cd _site'), 'GitHub Actions must publish the prepared site directory');
assert(pagesWorkflow.includes('cp index.html _site/'), 'Published site must include index.html');
assert(pagesWorkflow.includes('cp -R image/optimized _site/image/'), 'Published site must include the product image folders');
assert(pagesWorkflow.includes('rm -f _site/image/optimized/*.7z'), 'Published site must exclude the local image archive');
assert(pagesWorkflow.includes('php -l api/save-inquiry.php'), 'GitHub Actions must validate the enquiry API syntax');
assert(pagesWorkflow.includes('php -l api/visitor-stats.php'), 'GitHub Actions must validate the visitor API syntax');
assert(pagesWorkflow.includes('node tests/validate-site.js'), 'GitHub Actions must run the site structure tests');
assert(!pagesWorkflow.includes("path: '.'"), 'GitHub Pages must not publish the whole repository');

for (const relativePath of ['image/WeChat_QRcode.jpeg', 'image/WhatsApp_QRcode.jpeg', 'image/WeChat_QRcode-transparent.png', 'image/WhatsApp_QRcode-transparent.png']) {
    const filePath = path.join(root, relativePath);
    assert(fs.existsSync(filePath), `Missing QR asset: ${relativePath}`);
    assert(fs.statSync(filePath).size > 0, `Empty QR asset: ${relativePath}`);
}

const companyWebsiteQrPath = path.join(root, 'image/cossfood-com-qr.png');
assert(fs.existsSync(companyWebsiteQrPath), 'Missing cossfood.com QR asset');
assert(fs.statSync(companyWebsiteQrPath).size > 0, 'Empty cossfood.com QR asset');

for (const relativePath of ['image/logo-option-a-classic.png', 'image/logo-option-b-badge.png', 'image/logo-option-c-transparent.png']) {
    const filePath = path.join(root, relativePath);
    assert(fs.existsSync(filePath), `Missing Logo candidate: ${relativePath}`);
    assert(fs.statSync(filePath).size > 0, `Empty Logo candidate: ${relativePath}`);
}

const vectorLogoPaths = ['image/logo-header.svg', 'image/logo-hero.svg', 'image/logo-about.svg'];
for (const relativePath of vectorLogoPaths) {
    const filePath = path.join(root, ...relativePath.split('/'));
    assert(fs.existsSync(filePath), `Missing vector logo: ${relativePath}`);
    assert(fs.statSync(filePath).size > 0, `Empty vector logo: ${relativePath}`);
    const svg = fs.readFileSync(filePath, 'utf8');
    assert(svg.startsWith('<svg') && svg.includes('<path'), `Logo must be a crisp vector drawing: ${relativePath}`);
    assert(!svg.includes('data:image/png;base64'), `Logo must not embed a raster screenshot: ${relativePath}`);
}

const productImages = [...html.matchAll(/'(image\/optimized\/[^']+\.(?:jpg|jpeg|png|webp))'/g)].map((match) => match[1]);
assert(productImages.length >= 60, 'Product catalogue must reference the new multi-image folders');
for (const relativePath of new Set(productImages)) {
    const filePath = path.join(root, ...relativePath.split('/'));
    assert(fs.existsSync(filePath), `Missing product image: ${relativePath}`);
    assert(fs.statSync(filePath).size > 0, `Empty product image: ${relativePath}`);
}

const multiImageEntries = (html.match(/images: \[[^\]]*'[^']+',/g) || []).length;
assert(multiImageEntries >= 20, `Too few products have multiple images: ${multiImageEntries}`);

const localizedNames = (html.match(/names: \{ en: /g) || []).length;
assert(localizedNames === 36, `Every product needs en/zh/ms names, found ${localizedNames}`);
assert(html.includes("zh: '白馒头'"), 'Chinese product names are missing');
assert(html.includes("ms: 'Mantou Kosong (Putih)'"), 'Malay product names are missing');
assert(html.includes("zh: '猪肠粉 300g'"), 'Chinese name for Z001 is missing');
assert(html.includes("zh: '果蔬小馒头 180g'"), 'New fruit vegetable mantou Chinese name is missing');
assert(html.includes("en: 'Fruit & Vegetable Mantou 180g'"), 'New fruit vegetable mantou English name is missing');
assert(html.includes("ms: 'Mantou Buah dan Sayur 180g'"), 'New fruit vegetable mantou Malay name is missing');
assert(html.includes("zh: '荷叶包（大）400g'"), 'New large lotus leaf bun Chinese name is missing');
assert(html.includes("en: 'Lotus Leaf Bun (Large) 400g'"), 'New large lotus leaf bun English name is missing');
assert(html.includes("ms: 'Pau Daun Teratai (Besar) 400g'"), 'New large lotus leaf bun Malay name is missing');
assert(html.includes("zh: '红糖馒头 130g'"), 'New brown sugar mantou Chinese name is missing');
assert(html.includes("en: 'Brown Sugar Mantou 130g'"), 'New brown sugar mantou English name is missing');
assert(html.includes("ms: 'Mantou Gula Perang 130g'"), 'New brown sugar mantou Malay name is missing');
assert(/id: 'new-fruitveg', code: ''/.test(html), 'Fruit vegetable mantou must ship without a temporary code');
assert(/id: 'new-lotus-big', code: ''/.test(html), 'Large lotus leaf bun must ship without a temporary code');
assert(/id: 'new-brownsugar', code: ''/.test(html), 'Brown sugar mantou must ship without a temporary code');
assert(!html.includes("code: 'TP003'"), 'TP003 must stay delisted');
assert(/code: 'B003'[^\n]*brand: 'OBASAN'/.test(html), 'B003 brand must be OBASAN');
assert(/code: 'CS003'[^\n]*brand: 'WILLING'/.test(html), 'CS003 brand must be WILLING');
assert(/code: 'CF014'[^\n]*brand: 'LHF'/.test(html), 'CF014 brand must be LHF');
assert(html.includes('const productName = (product)'), 'Localized product name helper is missing');
assert(html.includes('escapeHtml(productName(product))'), 'Product cards must render the localized name');

const wordmarkPath = path.join(root, 'image/logo-header.svg');
assert(fs.existsSync(wordmarkPath), 'Header wordmark asset is missing');
assert(fs.statSync(wordmarkPath).size > 0, 'Header wordmark asset is empty');
assert(html.includes('src="image/logo-header.svg"'), 'Header must use the redrawn vector wordmark');
assert(!fs.existsSync(path.join(root, 'image', 'N001 MEGAH MEE CLAYPOT YEE MEE 375KG.jpg')), 'Old flat product images must be removed');
assert(!fs.existsSync(path.join(root, 'image', 'optimized', 'N001 MEGAH MEE CLAYPOT YEE MEE 375KG.webp')), 'Old optimized webp images must be removed');

assert(html.includes('data-gallery="prev"'), 'Product gallery previous button is missing');
assert(html.includes('data-gallery="next"'), 'Product gallery next button is missing');
assert(html.includes('gallery-count'), 'Product gallery image counter is missing');
assert(html.includes('touchstart'), 'Product gallery swipe handling is missing');
assert(html.includes('id="zoom-panel"'), 'Hover magnifier panel is missing');
assert(html.includes('.zoom-lens'), 'Magnifier lens frame is missing');
assert(html.includes("lens.className = 'zoom-lens'"), 'Magnifier lens is not attached to product images');
assert(html.includes('window.innerWidth >= 1440 ? 440 : window.innerWidth >= 1280 ? 400 : 340'), 'Magnifier panel size is missing');
assert(html.includes('requestAnimationFrame(() =>'), 'Magnifier movement is not frame-throttled');
assert(html.includes('function hideZoomPanel()'), 'Magnifier panel hide logic is missing');
assert(!html.includes('.product-image-wrap.zoomed'), 'In-place image scaling must be replaced by the magnifier panel');
assert(html.includes('id="lightbox"'), 'Full-screen image preview is missing');
assert(html.includes('function openLightbox(product, index)'), 'Lightbox open logic is missing');
assert(html.includes('.lightbox.zoomed .lightbox-img'), 'Lightbox zoom style is missing');
assert(html.includes('@media (hover: none)'), 'Touch devices must hide the gallery buttons');
assert(html.includes('data-i18n="languageLabel"'), 'Language selector label is missing');
assert(html.includes("languageLabel: '语言'"), 'Chinese language label translation is missing');
assert(html.includes("languageLabel: 'Language'"), 'English language label translation is missing');

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert(scriptMatch, 'Inline site script is missing');
new vm.Script(scriptMatch[1], { filename: indexPath });

console.log('PASS: CossFood site structure, QR assets, contact links and script syntax are valid.');
