const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const db = require('../db/connection');


db.con.getConnection((err) => {
    if (err) console.log(err);
    console.log('Base de dados a funcionar');
});


const router = express.Router();  //pass routes to app
//schema to validation for signup and login
const schema = Joi.object().keys({
    username: Joi.string().alphanum().min(2).max(30).required(),
    password: Joi.string().regex(/^[a-zA-Z0-0]{5,30}$/).required()
})

//any route in here is pre used with /auth
router.get('/', (req, res) => {
    res.json({
        message: 'auth works'
    });
});


// POST /auth/signup
router.post('/signup', (req, res, next) => {
    const result = schema.validate(req.body);

    if (result.value !== null) {


        db.con.query('SELECT * FROM users WHERE username = ?', req.body.username, (err, rows) => {

            if (err) console.log(err);

            if (rows.length == 0) { //user dont exists, so we can insert
                bcrypt.hash(req.body.password, 12, (err, hash) => {
                    let newUser = {
                        username: req.body.username,
                        password: hash
                    }

                    db.con.query('INSERT INTO users SET ?', newUser, (err, rows) => {
                        if (err) console.log(err);
                        res.json({ id: rows.insertId });
                    })

                });
            }
            else {
                res.status(404);
                const err = new Error('Already used, choose another one');
                next(err);
            }
        })
    }
    else {
        next(result.error);
    }
});

// POST /auth/login
router.post('/login', (req, res, next) => {
    const result = schema.validate(req.body);

    if (result.value !== null) {

        db.con.query('SELECT * FROM users WHERE username = ?', req.body.username, (err, rows) => {

            if (err) console.log(err);

            if (rows.length == 0) {
                res.status(404);
                const err = new Error('User not found');
                next(err);
            }
            else {

                let parsed = JSON.parse(JSON.stringify(rows));
                console.log(parsed);
                bcrypt.compare(req.body.password, parsed[0].password, function (err, result) {
                    if (result === true) { //right password
                        const payload = {
                            id: parsed[0].id,
                            username: parsed[0].username
                        };
                        jwt.sign(payload, process.env.TOKEN_SECRET, { //create token send response
                            expiresIn: '4d'
                        }, (err, token) => {
                            if (err) {
                                const err = new Error('Error in login, try later');
                                next(err);
                            } else {
                                res.json({ token: token, id: parsed[0].id });
                            }
                        });

                    }
                    else {
                        const err = new Error('Wrong password');
                        next(err);
                    }
                });
            }


        })

    }
    else {
        const err = new Error(result.error);
        next(err);
    }
});

/*
@param userId -> id
Update username
*/
router.patch('/changeUsername/:id', (req, res, next) => {
    const result = Joi.object().keys({
        username: Joi.string().alphanum().min(2).max(30).required()
    }).validate(req.body);

    if (result.value !== null) {

        db.con.query('SELECT * FROM users WHERE username = ?', req.body.username, (err, rows) => {

            if (err) console.log(err);

            if (rows.length == 0) { //user dont exists, so we can insert
                db.con.query('UPDATE users SET username = ? WHERE id = ?', [req.body.username, req.params.id], (err, result) => {
                    if (err)
                        next(err);
                    else if (result.affectedRows == 0) {
                        res.status(404);
                        const err = new Error('User not found');
                        next(err);
                    }
                    else {
                        res.status(200).send({ "msg": "Updated with success" });
                    }
                })
            } else {
                res.status(409).send({ "msg": "Error! Username already exists" });
            }


        })


    }
});

/*
@param userId -> id & currentPassword
Update password
body -> {password: ...}
*/
router.patch('/changePassword/:id&:currentPassword', (req, res, next) => {
    const result = Joi.object().keys({
        password: Joi.string().regex(/^[a-zA-Z0-0]{5,30}$/).required()
    }).validate(req.body);

    if (result.value !== null) {


        db.con.query('SELECT * FROM users WHERE id = ?', req.params.id, (err, result) => {
            if (err)
                next(err);
            else if (result.length == 0) {
                res.status(404);
                const err = new Error('User not found');
                next(err);
            }
            else {

                bcrypt.compare(req.params.currentPassword, result[0].password, function (err, result) {
                    if (result === true) {
                        bcrypt.hash(req.body.password, 12, (err, hash) => {

                            db.con.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.params.id], (err, rows) => {
                                if (err)
                                    next(err);
                                else {
                                    res.status(200).send({ "msg": "Updated with success" });
                                }
                            })
                        })
                    }
                    else {
                        res.status(401).send({ "msg": "Current password is wrong" });
                    }
                })

            }
        })
    }
});


module.exports = router; // now can be used by anyone wants to require it