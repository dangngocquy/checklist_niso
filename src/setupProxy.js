const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    const Backend = 'https://localhost:3003';
    // const Backend = 'https://checklist.niso.com.vn:3002';


    app.use([
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
    ], createProxyMiddleware({
        target: Backend,
        changeOrigin: true,
        secure: false,
        pathRewrite: {
            '^/api': '/api'
        },
        onError: (err, req, res) => {
            console.error('Proxy Error:', err);
            res.status(500).send('Proxy Error');
        }
    }));
};