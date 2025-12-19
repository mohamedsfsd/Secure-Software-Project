'use strict';

module.exports = (app, db) => {

    /* =========================
       GET /v1/status/:brand
       FIX: RCE
    ========================== */
    app.get('/v1/status/:brand', (req, res) => {
        const brand = req.params.brand;

        const allowedBrands = ['bud', 'heineken', 'corona'];

        if (!allowedBrands.includes(brand)) {
            return res.status(400).json({ error: 'Invalid brand' });
        }

        res.json({
            brand: brand,
            status: 'available'
        });
    });

    /* =========================
       GET /v1/redirect
       FIX: Open Redirect
    ========================== */
    app.get('/v1/redirect', (req, res) => {
        const url = req.query.url;

        const allowedUrls = [
            'https://www.bud.com',
            'https://www.heineken.com'
        ];

        if (!url || !allowedUrls.includes(url)) {
            return res.status(400).json({ error: 'Invalid redirect URL' });
        }

        res.redirect(url);
    });

    /* =========================
       POST /v1/init
       FIX: Insecure Deserialization
    ========================== */
    app.post('/v1/init', (req, res) => {
        const body = req.body;

        if (typeof body !== 'object' || body === null || Array.isArray(body)) {
            return res.status(400).json({ error: 'Invalid input format' });
        }

        console.log('Initialized data:', body);

        res.json({
            status: 'Initialization completed safely'
        });
    });

    /* =========================
       GET /v1/test
       FIX: SSRF
    ========================== */
    app.get('/v1/test', (req, res) => {
        const url = req.query.url;

        if (!url) {
            return res.status(400).json({ error: 'No URL provided' });
        }

        // Block internal & local requests
        if (
            url.startsWith('http://localhost') ||
            url.startsWith('http://127.') ||
            url.startsWith('http://169.254') ||
            url.startsWith('https://localhost') ||
            url.startsWith('https://127.')
        ) {
            return res.status(403).json({ error: 'SSRF attempt blocked' });
        }

        // Validation only – no request execution
        res.json({
            status: 'URL validated successfully',
            note: 'No server-side request was made'
        });
    });

};
