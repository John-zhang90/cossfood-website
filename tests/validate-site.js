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
assert(html.includes('image/logo_company.png'), 'Selected A logo is not used in the about section');
assert(fs.existsSync(path.join(root, 'image/logo_company.png')), 'Selected A logo asset is missing');
assert(html.includes('height: min(440px, calc(100vh - 78px))'), 'Hero section is still too tall on desktop');
assert(html.includes('object-fit: contain; object-position: center'), 'Hero logo is not fitted without grey cropping margins');
assert(html.includes('image/logo-horizontal.png'), 'Horizontal hero logo is missing');
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
assert(html.includes('setInterval(recordVisit, 60000)'), 'Visitor statistics should refresh periodically');
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
assert(visitorApi.includes('flock($lock, LOCK_EX)'), 'Visitor storage must use a write lock');
assert(pagesWorkflow.includes('path: _site'), 'GitHub Pages must publish the prepared public site directory');
assert(pagesWorkflow.includes('cp index.html _site/'), 'GitHub Pages artifact must include index.html');
assert(pagesWorkflow.includes('cp -R image _site/'), 'GitHub Pages artifact must include image assets');
assert(pagesWorkflow.includes('php -l api/save-inquiry.php'), 'GitHub Actions must validate the enquiry API syntax');
assert(pagesWorkflow.includes('php -l api/visitor-stats.php'), 'GitHub Actions must validate the visitor API syntax');
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

const horizontalLogoPath = path.join(root, 'image/logo-horizontal.png');
assert(fs.existsSync(horizontalLogoPath), 'Horizontal Logo asset is missing');
assert(fs.statSync(horizontalLogoPath).size > 0, 'Empty horizontal Logo asset');

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert(scriptMatch, 'Inline site script is missing');
new vm.Script(scriptMatch[1], { filename: indexPath });

console.log('PASS: CossFood site structure, QR assets, contact links and script syntax are valid.');
