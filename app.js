const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const forge = require('node-forge');
const fs = require('fs');
const https = require('https');

const app = express();

const baseProxyConfig = {
  target: 'https://localhost:3003',
  changeOrigin: true,
  secure: false,
  timeout: 60000,
  proxyTimeout: 60000,
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).send('Proxy Error');
  }
};

const routes = [
  '/api/*',
  '/api/quizzes/*',
  '/slider/*',
  '/login/*',
  '/logout/*',
  '/permissions/*',
  '/modules/*',
  '/phanquyen/*',
  '/phanquyentaikhoan/*',
  '/phanquyencuahang/*',
  '/users/*',
  '/tablea/*',
  '/chinhanh/*',
  '/share/*',
  '/content/*',
  '/checklist/*',
  '/docs/*',
  '/report/*',
  '/xeploai/*',
  '/traloi/*',
  '/history/*',
  '/thongbao/*',
  '/giaoviec/*',
  '/baomat/*',
  '/nua/*'
];

routes.forEach(route => {
  app.use(route, createProxyMiddleware({
    ...baseProxyConfig,
    onProxyRes: (proxyRes, req, res) => {
      proxyRes.headers['X-Proxied'] = 'true';
    },
    pathRewrite: {}
  }));
});

app.use(express.static(path.join(__dirname, './build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './build', 'index.html'));
});

const pfxFile = fs.readFileSync(path.resolve(__dirname, 'SSL/certificate.pfx'));
const p12Asn1 = forge.asn1.fromDer(pfxFile.toString('binary'), false);
const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, '123456'); 
let cert, key;
for (const safeContents of p12.safeContents) {
  for (const safeBag of safeContents.safeBags) {
    if (safeBag.cert) {
      cert = forge.pki.certificateToPem(safeBag.cert);
    } else if (safeBag.key) {
      key = forge.pki.privateKeyToPem(safeBag.key);
    }
  }
}

const PORT = 3002;
const httpsServer = https.createServer({
  key: key,
  cert: cert
}, app);

httpsServer.listen(PORT, () => {
  console.log(`Frontend server đang chạy trên cổng ${PORT} (HTTPS)`);
});

// Bảo vệ source
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// Chặn truy cập vào các file map
app.use('*.map', (req, res) => {
  res.status(404).send('Not found');
});