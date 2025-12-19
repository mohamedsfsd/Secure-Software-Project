'use strict';

var fs = require('fs');
var path = require('path');

module.exports = (app, db) => {

    /* 
       1️- GET /v1/order
       Fix: Excessive Data Exposure
       */
    app.get('/v1/order', (req, res) => {
        db.beer.findAll({
                attributes: ['id', 'name', 'price'] // نرجّع بس اللي محتاجينه
            })
            .then(beers => {
                res.json(beers);
            })
            .catch(() => {
                res.status(500).json({ error: 'server error' });
            });
    });

    /*
       2️-GET /v1/beer-pic
       Fix: Path Traversal
       */
    app.get('/v1/beer-pic/', (req, res) => {

        const filename = req.query.picture;

        // validation بسيط
        if (!filename || filename.includes('..') || filename.includes('/')) {
            return res.status(400).send('invalid filename');
        }

        const uploadsDir = path.join(__dirname, '../../../uploads');
        const fullPath = path.join(uploadsDir, filename);

        // نتأكد إن الملف جوه uploads
        if (!fullPath.startsWith(uploadsDir)) {
            return res.status(403).send('access denied');
        }

        fs.readFile(fullPath, (err, data) => {
            if (err) {
                return res.status(404).send('file not found');
            }

            res.type('image/jpeg');
            res.send(data);
        });
    });

    /* 
       3️- GET /v1/search
       Fix: SQL Injection
        */
    app.get('/v1/search/:filter/:query', (req, res) => {

        const allowedFilters = ['id', 'name', 'price'];
        const filter = req.params.filter;
        const query = req.params.query;

        // whitelist للـ columns
        if (!allowedFilters.includes(filter)) {
            return res.status(400).send('invalid filter');
        }

        const sql = `SELECT * FROM beers WHERE ${filter} = :value`;

        db.sequelize.query(sql, {
                replacements: { value: query },
                type: db.sequelize.QueryTypes.SELECT
            })
            .then(result => {
                res.status(200).json(result);
            })
            .catch(() => {
                res.status(500).send('query failed');
            });
    });

};