'use strict';

const jwt = require("jsonwebtoken");

module.exports = (app, db) => {

    /* - HELPERS - */
    function getTokenData(req, res) {
        if (!req.headers.authorization) {
            res.status(401).json({ error: "Unauthorized" });
            return null;
        }

        try {
            return jwt.verify(
                req.headers.authorization.split(' ')[1],
                process.env.JWT_SECRET
            );
        } catch {
            res.status(401).json({ error: "Invalid token" });
            return null;
        }
    }

    /* - ADMIN - */

    app.get('/v1/admin/users/', (req, res) => {
        const tokenData = getTokenData(req, res);
        if (!tokenData) return;

        if (tokenData.role !== 'admin') {
            return res.status(403).json({ error: "Admins only" });
        }

        db.user.findAll({ include: "beers" })
            .then(users => res.json(users))
            .catch(() => res.status(500).json({ error: "DB error" }));
    });

    app.put('/v1/admin/promote/:id', (req, res) => {
        const tokenData = getTokenData(req, res);
        if (!tokenData) return;

        if (tokenData.role !== 'admin') {
            return res.status(403).json({ error: "Admins only" });
        }

        db.user.update({ role: 'admin' }, { where: { id: req.params.id } }).then(() => res.json({ success: true }));
    });

    /* - USER - */

    app.get('/v1/user/:id', (req, res) => {
        const tokenData = getTokenData(req, res);
        if (!tokenData) return;

        if (tokenData.id != req.params.id && tokenData.role !== 'admin') {
            return res.status(403).json({ error: "Forbidden" });
        }

        db.user.findOne({
            where: { id: req.params.id },
            include: 'beers'
        }).then(user => res.json(user));
    });

    app.delete('/v1/user/:id', (req, res) => {
        const tokenData = getTokenData(req, res);
        if (!tokenData) return;

        if (tokenData.role !== 'admin') {
            return res.status(403).json({ error: "Admins only" });
        }

        db.user.destroy({ where: { id: req.params.id } })
            .then(() => res.json({ result: "deleted" }));
    });

    app.put('/v1/user/:id', (req, res) => {
        const tokenData = getTokenData(req, res);
        if (!tokenData) return;

        if (tokenData.id != req.params.id) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const allowedData = {
            email: req.body.email,
            address: req.body.address,
            profile_pic: req.body.profile_pic
        };

        db.user.update(
            allowedData, { where: { id: req.params.id } }
        ).then(() => res.json({ success: true }));
    });

    app.post('/v1/user/', (req, res) => {
        const emailRegex =
            /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

        if (!emailRegex.test(req.body.email)) {
            return res.json({ error: "Invalid email format" });
        }

        db.user.create({
            name: req.body.name,
            email: req.body.email,
            role: 'user',
            address: req.body.address,
            password: req.body.password
        }).then(user => res.json(user));
    });

    /* - AUTH - */

    app.post('/v1/user/token', (req, res) => {
        db.user.findOne({ where: { email: req.body.email } })
            .then(user => {
                if (!user || user.password !== req.body.password) {
                    return res.status(401).json({ error: "Invalid credentials" });
                }

                const token = jwt.sign({ id: user.id, role: user.role },
                    process.env.JWT_SECRET, { expiresIn: 86400 }
                );

                res.json({ jwt: token });
            });
    });

    app.post('/v1/user/login', (req, res) => {
        db.user.findOne({ where: { email: req.body.email } })
            .then(user => {
                if (!user || user.password !== req.body.password) {
                    return res.status(401).json({ error: "Invalid credentials" });
                }
                res.json(user);
            });
    });

    /* - LOVE (CSRF FIX) - */

    app.get('/v1/love/:beer_id', (req, res) => {
        res.status(405).json({ error: "Method Not Allowed" });
    });

    app.post('/v1/love/:beer_id', (req, res) => {
        const tokenData = getTokenData(req, res);
        if (!tokenData) return;

        db.beer.findOne({ where: { id: req.params.beer_id } })
            .then(beer => {
                if (!beer) {
                    return res.status(404).json({ error: "Beer not found" });
                }

                return db.user.findOne({ where: { id: tokenData.id } })
                    .then(user => user.addBeer(beer))
                    .then(() => res.json({ success: true }));
            });
    });

    /* - OTP - */

    app.post('/v1/user/:id/validate-otp', (req, res) => {
        const tokenData = getTokenData(req, res);
        if (!tokenData) return;

        if (tokenData.id != req.params.id) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const otplib = require('otplib');

        if (!otplib.authenticator.check(
                req.query.token,
                process.env.OTP_SECRET
            )) {
            return res.status(401).json({ error: "Invalid OTP" });
        }

        const newToken = jwt.sign({ id: tokenData.id, role: tokenData.role },
            process.env.JWT_SECRET, { expiresIn: 86400 }
        );

        res.json({ jwt: newToken });
    });

};