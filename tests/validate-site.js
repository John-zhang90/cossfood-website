const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const cpanelPath = path.join(root, '.cpanel.yml');
const html = fs.readFileSync(indexPath, 'utf8');
const cpanel = fs.readFileSync(cpanelPath, 'utf8');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

assert(html.includes('data-i18n="navContact"'), 'Header WhatsApp contact is missing');
assert((html.match(/\+65 8756 9015/g) || []).length >= 6, 'New Singapore phone number is not shown in all required contact copy');
assert(!html.includes('6773 3116'), 'Old displayed phone number is still present');
assert(!html.includes('6567733116'), 'Old phone or WhatsApp target is still present');
assert(html.includes('https://wa.me/6587569015'), 'WhatsApp links do not use the new phone number');
assert(html.includes('href="tel:+6587569015"'), 'Phone link does not use the new phone number');
assert(html.includes('const wechatQrUrl = \'image/WeChat_QRcode.jpeg\';'), 'WeChat QR URL constant is missing');
assert(html.includes('href="${wechatQrUrl}"'), 'Red product contact buttons do not use the WeChat QR code');
assert(!html.includes('<a class="call" href="tel:'), 'Red product contact buttons still dial the phone directly');
assert(html.includes('image/WeChat_QRcode.jpeg'), 'WeChat QR code is not referenced');
assert(html.includes('image/WhatsApp_QRcode.jpeg'), 'WhatsApp QR code is not referenced');
assert(html.includes('data-i18n="footerQrTitle"'), 'Footer QR section title is missing');
assert(html.includes('data-i18n-alt="wechatQrAlt"'), 'WeChat QR alt translation hook is missing');
assert(html.includes('data-i18n-alt="whatsappQrAlt"'), 'WhatsApp QR alt translation hook is missing');
assert(html.includes('background: #f1dfc7'), 'Footer QR cards are missing the softer brand background');
assert(html.includes('border-radius: 10px'), 'Footer QR cards are missing rounded corners');
assert(cpanel.includes('export DEPLOYPATH=/home/cossfood/public_html/'), 'cPanel deployment path is incorrect');
assert(cpanel.includes('/bin/cp index.html $DEPLOYPATH'), 'cPanel deployment does not copy index.html');
assert(cpanel.includes('/bin/cp -R image $DEPLOYPATH'), 'cPanel deployment does not copy the image directory');

for (const relativePath of ['image/WeChat_QRcode.jpeg', 'image/WhatsApp_QRcode.jpeg']) {
    const filePath = path.join(root, relativePath);
    assert(fs.existsSync(filePath), `Missing QR asset: ${relativePath}`);
    assert(fs.statSync(filePath).size > 0, `Empty QR asset: ${relativePath}`);
}

const companyWebsiteQrPath = path.join(root, 'image/cossfood-com-qr.png');
assert(fs.existsSync(companyWebsiteQrPath), 'Missing cossfood.com QR asset');
assert(fs.statSync(companyWebsiteQrPath).size > 0, 'Empty cossfood.com QR asset');

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert(scriptMatch, 'Inline site script is missing');
new vm.Script(scriptMatch[1], { filename: indexPath });

console.log('PASS: CossFood site structure, QR assets, contact links and script syntax are valid.');
