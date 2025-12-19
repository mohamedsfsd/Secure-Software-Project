'use strict';

const os = require('os');
const multer = require('multer');
const Hoek = require('hoek');

module.exports = (app, db) => {

    /* -
       POST /v1/admin/new-beer
       FIX: Validation + Injection
    - */
    app.post('/v1/admin/new-beer/', (req, res) => {

        const beerName = typeof req.body.name === 'string' ?
            req.body.name.trim() :
            null;

        const beerPrice = Number(req.body.price);

        if (!beerName || isNaN(beerPrice) || beerPrice <= 0) {
            return res.status(400).json({ error: 'Invalid beer data' });
        }

        db.beer.create({
            name: beerName,
            currency: 'USD',
            stock: 'plenty',
            price: beerPrice,
            picture: req.body.picture || null
        }).then(new_beer => {
            res.json(new_beer);
        }).catch(() => {
            res.status(500).json({ error: 'Could not create beer' });
        });
    });

    /* -
       POST /v1/admin/upload-pic
       FIX: File Upload Validation
    -*/
    const uploadImage = multer({
        dest: './uploads/',
        limits: { fileSize: 2 * 1024 * 1024 } // 2MB
    });

    app.post('/v1/admin/upload-pic/', uploadImage.single('file'), (req, res) => {

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Allow images only
        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({ error: 'Invalid file type' });
        }

        res.json({
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
    });

    /* -
       POST /v1/admin/new-beer-xml
       FIX: XXE
    - */
    const uploadXML = multer({ storage: multer.memoryStorage() });

    app.post('/v1/admin/new-beer-xml/', uploadXML.single('file'), (req, res) => {

        if (!req.file) {
            return res.status(400).json({ error: 'No XML file provided' });
        }

        try {
            const xml = req.file.buffer.toString();

            // parse XML safely using fast-xml-parser (no native modules)
            const { XMLParser } = require('fast-xml-parser');
            const parser = new XMLParser({
                ignoreAttributes: false,
                processEntities: false
            });
            const parsed = parser.parse(xml);

            function findValue(obj, key) {
                if (!obj || typeof obj !== 'object') return null;
                if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
                for (const k of Object.keys(obj)) {
                    const res = findValue(obj[k], key);
                    if (res !== null && res !== undefined) return res;
                }
                return null;
            }

            function toText(node) {
                if (node == null) return null;
                if (typeof node === 'string' || typeof node === 'number') return String(node);
                if (Array.isArray(node)) return toText(node[0]);
                if (typeof node === 'object') {
                    if (node.hasOwnProperty('#text')) return node['#text'];
                    for (const v of Object.values(node)) {
                        if (typeof v === 'string' || typeof v === 'number') return String(v);
                        if (Array.isArray(v) && (typeof v[0] === 'string' || typeof v[0] === 'number')) return String(v[0]);
                    }
                }
                return null;
            }

            const nameNode = findValue(parsed, 'name');
            const priceNode = findValue(parsed, 'price');

            if (!nameNode || !priceNode) {
                return res.status(400).json({ error: 'Invalid XML structure' });
            }

            const beerName = toText(nameNode);
            const beerPrice = Number(toText(priceNode));

            if (!beerName || isNaN(beerPrice)) {
                return res.status(400).json({ error: 'Invalid XML values' });
            }

            db.beer.create({
                name: beerName,
                currency: 'USD',
                stock: 'plenty',
                price: beerPrice
            }).then(new_beer => {
                res.json(new_beer);
            });

        } catch (err) {
            //  no stack trace / no internal error exposure
            res.status(400).json({ error: 'Invalid XML file' });
        }
    });
};