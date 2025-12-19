'use strict';

module.exports = (app, db) => {

    /* -
       Helper: Escape HTML (XSS)
       (بدون أي مكتبة)
    -*/
    function escapeHTML(str = '') {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* 
       GET /
       FIX: SSTI + Reflected XSS
    -*/
    app.get('/', (req, res) => {
        console.log(req.session);

        const message = req.query.message ?
            escapeHTML(req.query.message) :
            "Please log in to continue";

        // ❌ no renderString
        res.render('user.html', { message });
    });

    /* -
       GET /register
       FIX: SSTI + XSS
    -*/
    app.get('/register', (req, res) => {

        const message = req.query.message ?
            escapeHTML(req.query.message) :
            "Please log in to continue";

        res.render('user-register.html', { message });
    });

    /* -
       GET /registerform
       FIX: Input validation
    -*/
    app.get('/registerform', (req, res) => {

        const userEmail = req.query.email;
        const userName = escapeHTML(req.query.name);
        const userRole = 'user';
        const userPassword = req.query.password;
        const userAddress = escapeHTML(req.query.address);

        if (!userEmail || !userPassword) {
            res.redirect("/register?message=Missing required fields");
            return;
        }

        const emailExpression = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

        if (!emailExpression.test(userEmail)) {
            res.redirect("/register?message=Invalid email format");
            return;
        }

        const md5 = require('md5');

        db.user.create({
            name: userName,
            email: userEmail,
            role: userRole,
            address: userAddress,
            password: md5(userPassword)
        }).then(new_user => {
            res.redirect('/profile?id=' + new_user.id);
        }).catch(() => {
            res.redirect('/?message=Error registering, please try again');
        });
    });

    /* -
       GET /login
       FIX: Auth logic + XSS
    -*/
    app.get('/login', (req, res) => {

        const userEmail = req.query.email;
        const userPassword = req.query.password;

        if (!userEmail || !userPassword) {
            res.redirect('/?message=Missing credentials');
            return;
        }

        db.user.findAll({
            where: { email: userEmail }
        }).then(user => {

            if (user.length === 0) {
                res.redirect('/?message=Invalid email or password');
                return;
            }

            const md5 = require('md5');

            // -compare hashed password only
            if (user[0].password === md5(userPassword)) {
                req.session.logged = true;
                res.redirect('/profile?id=' + user[0].id);
                return;
            }

            res.redirect('/?message=Invalid email or password');
        });
    });

    /* -
       GET /profile
       FIX: ID validation + XSS
    -*/
    app.get('/profile', (req, res) => {

        const userId = parseInt(req.query.id, 10);

        if (!userId) {
            res.redirect("/?message=Unauthorized access");
            return;
        }

        db.user.findAll({
            include: ['beers'],
            where: { id: userId }
        }).then(user => {

            if (user.length === 0) {
                res.redirect('/?message=User not found');
                return;
            }

            db.beer.findAll().then(beers => {
                res.render('profile.html', {
                    beers,
                    user: user[0]
                });
            });
        });
    });

    /* -
       GET /beer
       FIX: XSS + logic issues
    -*/
    app.get('/beer', (req, res) => {

        const beerId = parseInt(req.query.id, 10);
        const userId = parseInt(req.query.user, 10);

        if (!beerId || !userId) {
            res.redirect("/?message=Invalid request");
            return;
        }

        db.beer.findAll({
            include: 'users',
            where: { id: beerId }
        }).then(beer => {

            if (beer.length === 0) {
                res.redirect('/?message=Beer not found');
                return;
            }

            db.user.findOne({ where: { id: userId } }).then(user => {

                if (!user) {
                    res.redirect('/?message=User not found');
                    return;
                }

                user.hasBeer(beer).then(result => {

                    let love_message = result ?
                        "You Love THIS BEER!!" :
                        "...";

                    if (req.query.relationship) {
                        love_message = escapeHTML(req.query.relationship);
                    }

                    res.render('beer.html', {
                        beers: beer,
                        message: love_message,
                        user: user
                    });
                });
            });
        });
    });
};