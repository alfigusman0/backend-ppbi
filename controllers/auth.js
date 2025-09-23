/* Config */
const encrypt = require('../config/encrypt');
const redis = require('../config/redis');
/* Libraries */
const jwt = require('jsonwebtoken');
const moment = require("moment");
const md5 = require('md5');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const {
    google
} = require('googleapis');
/* Helpers */
const helper = require('../helpers/helper');
const response = require('../helpers/response');
/* Logger */
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.json()
    ),
    handleExceptions: true,
    handleRejections: true,
    transports: [
        new winston.transports.Console({}),
        new DailyRotateFile({
            filename: "./logs/log-%DATE%.log",
            zippedArchive: true,
            maxSize: "100m",
            maxFiles: "14d"
        }),
    ]
});

const Controller = {};

const redisPrefix = process.env.REDIS_PREFIX + "session:";

// Helper function to handle errors
const handleError = (error, res) => {
    logger.error(error);
    return response.sc500('An error occurred in the system, please try again.', {}, res);
};

const oauth2Client = new google.auth.OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET,
    process.env.OAUTH_REDIRECT_URL
);

const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid'
]

const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true
});

Controller.google = async (req, res) => {
    return res.redirect(authorizationUrl);
}

Controller.callback = async (req, res) => {
    try {
        let userJwt = {};
        let token = '';
        let expire_at = moment().add(process.env.JWT_EXPIRED_IN, 'days').format("YYYY-MM-DD HH:mm:ss")
        const {
            code
        } = req.query;
        const {
            tokens
        } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: 'v2'
        });
        const {
            data
        } = await oauth2.userinfo.get();

        if (!data.email || !data.name) {
            return response.sc400('Failed to retrieve user information from Google.', {}, res);
        }

        /* SQL Query */
        let sqlQuery = {
            sql: "SELECT * FROM `tbl_users` WHERE email = ?",
            param: [data.email]
        }
        let getUser = await helper.runSQL(sqlQuery);
        if (!getUser.length) {
            /* SQL Query Insert Data JWT */
            let sqlInsert = {
                sql: "INSERT INTO `tbl_users`( `nama`, `email`, `password`, `nmr_tlpn`, `mandiri`) VALUES (?, ?, ?, ?, ?)",
                param: [data.name, data.email, null, null, 'BELUM MEMILIH']
            }
            await helper.runSQL(sqlInsert);
            getUser = await helper.runSQL(sqlQuery);
        }

        userJwt = {
            userTime: await helper.id(),
            app: process.env.APP_NAME,
            id_user: getUser[0].id_user,
            nama: getUser[0].nama,
            email: getUser[0].email,
            username: getUser[0].username,
            nmr_tlpn: getUser[0].nmr_tlpn,
            mandiri: getUser[0].mandiri,
            ids_level: getUser[0].ids_level,
            level: getUser[0].level,
            tingkat: getUser[0].tingkat,
            ids_grup: getUser[0].ids_grup,
            grup: getUser[0].grup,
            keterangan: getUser[0].keterangan,
            login_as: "TIDAK",
            id_admin: null,
        };
        token = jwt.sign(userJwt, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRED_IN + 'd',
        });

        /* Save to Database or Redis */
        if (process.env.SESSIONS === 'DATABASE') {
            /* SQL Query Insert Data JWT */
            let sqlInsert = {
                sql: "INSERT INTO `tbl_jwt`( `headers`, `ip_address`, `token`, `expire_at`, `expired`, `keterangan`) VALUES (?, ?, ?, ?, ?, ?)",
                param: [JSON.stringify(req.headers), req.ip, token, expire_at, 'TIDAK', 'LOGIN']
            }
            await helper.runSQL(sqlInsert);
        } else if (process.env.SESSIONS === 'REDIS') {
            const saveRedis = {
                headers: JSON.stringify(req.headers),
                ip_address: req.ip,
                token: token,
                expire_at: expire_at,
                expired: 'TIDAK',
                keterangan: 'LOGIN',
            }
            const key = redisPrefix + md5(token);
            await redis.set(key, JSON.stringify(saveRedis), 'EX', 60 * 60 * 24 * process.env.JWT_EXPIRED_IN).catch((err) => {
                console.error('Redis error:', err);
            });
        }

        return res.redirect(process.env.FRONTEND_URL + 'auth/google/' + token);
    } catch (error) {
        console.log(error);
        return handleError(error, res);
    }
}

Controller.login = async (req, res, next) => {
    let message = '';
    let json = {};
    try {
        let username = req.body.username;
        let password = req.body.password;
        let expire_at = moment().add(process.env.JWT_EXPIRED_IN, 'days').format("YYYY-MM-DD HH:mm:ss");

        /* SQL Query */
        let sqlQuery = {
            sql: "SELECT * FROM `view_users_grup` WHERE username = ?",
            param: [username]
        }
        let getUser = await helper.runSQL(sqlQuery);
        if (!getUser.length) {
            message = 'username not found.';
            return response.sc400(message, json, res);
        }

        /* Checking password null */
        if (!getUser[0].password) {
            message = 'Anda login menggunakan google. silahkan login kembali menggunakan google.';
            return response.sc400(message, json, res);
        }

        /* Checking Password */
        if (getUser[0].password.startsWith('$2y$')) {
            getUser[0].password = '$2b$' + getUser[0].password.slice(4);
        }
        if (encrypt.Check(password, getUser[0].password)) {
            const userJwt = {
                userTime: await helper.id(),
                app: process.env.APPLICATION_NAME,
                id_user: getUser[0].id_user,
                username: getUser[0].username,
                ids_level: getUser[0].ids_level,
                level: getUser[0].level,
                tingkat: getUser[0].tingkat,
                ids_grup: getUser[0].ids_grup,
                grup: getUser[0].grup,
                import: getUser[0].import,
                keterangan: getUser[0].keterangan,
                login_as: "TIDAK",
                id_admin: null,
            };
            const token = jwt.sign(userJwt, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRED_IN + 'd',
            });

            /* Save to Database or Redis */
            if (process.env.SESSIONS === 'DATABASE') {
                let sqlInsert = {
                    sql: "INSERT INTO `tbl_jwt`(`id_user`, `headers`, `ip_address`, `token`, `expire_at`, `expired`, `keterangan`) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    param: [getUser[0].id_user, JSON.stringify(req.headers), req.ip, token, expire_at, 'TIDAK', 'LOGIN']
                }
                await helper.runSQL(sqlInsert);
            } else if (process.env.SESSIONS === 'REDIS') {
                const saveRedis = {
                    headers: JSON.stringify(req.headers),
                    ip_address: req.ip,
                    token: token,
                    expire_at: expire_at,
                    expired: 'TIDAK',
                    keterangan: 'LOGIN',
                }
                const key = redisPrefix + md5(token);
                await redis.set(key, JSON.stringify(saveRedis), 'EX', 60 * 60 * 24 * process.env.JWT_EXPIRED_IN).catch((err) => {
                    console.error('Redis error:', err);
                });
            }

            json = {
                token: token
            };
            return response.sc200(message, json, res);
        } else {
            message = 'Password is wrong.';
            return response.sc400(message, json, res);
        }
    } catch (error) {
        console.log(error);
        return handleError(error, res);
    }
}

Controller.register = async (req, res, next) => {
    try {
        const {
            username,
            password,
        } = req.body;

        /* Checking username */
        let getUser = await helper.runSQL({
            sql: "SELECT * FROM `tbl_users` WHERE username = ?",
            param: [username]
        });
        if (getUser.length) {
            return response.sc400('Username already exist.', {}, res);
        }

        /* Hash Password */
        const hashedPassword = await encrypt.Hash(password);

        /* Save to Database */
        await helper.runSQL({
            sql: "INSERT INTO `tbl_users`(`ids_grup`, `username`, `password`) VALUES (?, ?, ?)",
            param: [8, username, hashedPassword]
        });

        return response.sc200('Data added successfully.', {}, res);
    } catch (error) {
        console.log(error);
        return handleError(error, res);
    }
}

Controller.logout = async (req, res, next) => {
    let message = '';
    let json = {};
    try {
        if (!req.authToken) {
            message = 'You are not logged in.';
            return response.sc400(message, json, res);
        }

        if (process.env.SESSIONS === 'DATABASE') {
            let sqlUpdate = {
                sql: "UPDATE `tbl_jwt` SET `expired` = ?, `keterangan` = ?  WHERE `token` = ?",
                param: ['YA', 'LOGOUT', req.authToken]
            }
            await helper.runSQL(sqlUpdate);
        } else if (process.env.SESSIONS === 'REDIS') {
            const key = redisPrefix + md5(req.authToken);
            try {
                await helper.deleteKeysByPattern(key);
            } catch (redisError) {
                console.error('Session delete redis error:', redisError);
            }
        }
        return response.sc200('You have successfully logged out!', json, res);
    } catch (error) {
        console.log(error);
        return handleError(error, res);
    }
}

Controller.createToken = async (req, res, next) => {
    let message = '';
    let json = {};
    try {
        let payload = req.body.payload || null;
        if (!payload) {
            message = 'Payload is missing.';
            return response.sc400(message, json, res);
        }

        let expire_at = moment().add(process.env.JWT_EXPIRED_IN, 'days').format("YYYY-MM-DD HH:mm:ss");

        // Generate Token
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRED_IN + 'd',
        });

        /* Save to Database or Redis */
        if (process.env.SESSIONS === 'DATABASE') {
            let sqlInsert = {
                sql: "INSERT INTO `tbl_jwt`( `headers`, `ip_address`, `token`, `expire_at`, `expired`, `keterangan`) VALUES (?, ?, ?, ?, ?, ?)",
                param: [JSON.stringify(req.headers), req.ip, token, expire_at, 'TIDAK', 'LOGIN']
            }
            await helper.runSQL(sqlInsert);
        } else if (process.env.SESSIONS === 'REDIS') {
            const saveRedis = {
                headers: JSON.stringify(req.headers),
                ip_address: req.ip,
                token: token,
                expire_at: expire_at,
                expired: 'TIDAK',
                keterangan: 'LOGIN',
            }
            const key = redisPrefix + md5(token);
            await redis.set(key, JSON.stringify(saveRedis), 'EX', 60 * 60 * 24 * process.env.JWT_EXPIRED_IN).catch((err) => {
                console.error('Redis error:', err);
            });
        }

        json = {
            token: token
        };
        return response.sc200(message, json, res);
    } catch (error) {
        console.log(error);
        return handleError(error, res);
    }
}

Controller.refreshToken = async (req, res, next) => {
    let message = '';
    let json = {};
    try {
        if (!req.authToken) {
            message = 'You are not logged in.';
            return response.sc400(message, json, res);
        }

        let payload = req.body.payload || null;
        console.log('Payload:', payload);
        if (!payload) {
            message = 'Payload is missing.';
            return response.sc400(message, json, res);
        }

        // Generate Token
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRED_IN + 'd',
        });

        /* Save to Database or Redis */
        if (process.env.SESSIONS === 'DATABASE') {
            let sqlInsert = {
                sql: "INSERT INTO `tbl_jwt`( `headers`, `ip_address`, `token`, `expire_at`, `expired`, `keterangan`) VALUES (?, ?, ?, ?, ?, ?)",
                param: [JSON.stringify(req.headers), req.ip, token, expire_at, 'TIDAK', 'LOGIN']
            }
            await helper.runSQL(sqlInsert);
        } else if (process.env.SESSIONS === 'REDIS') {
            const saveRedis = {
                headers: JSON.stringify(req.headers),
                ip_address: req.ip,
                token: token,
                expire_at: expire_at,
                expired: 'TIDAK',
                keterangan: 'LOGIN',
            }
            const key = redisPrefix + md5(token);
            await redis.set(key, JSON.stringify(saveRedis), 'EX', 60 * 60 * 24 * process.env.JWT_EXPIRED_IN).catch((err) => {
                console.error('Redis error:', err);
            });
        }

        json = {
            token: token
        };
        return response.sc200('Token has been refreshed successfully', json, res);
    } catch (error) {
        console.log(error);
        return handleError(error, res);
    }
}

Controller.checkToken = async (req, res, next) => {
    let json = {};
    try {
        return response.sc200('Your token is still active', json, res);
    } catch (error) {
        console.log(error);
        return handleError(error, res);
    }
}

Controller.deleteToken = async (req, res, next) => {
    let message = '';
    let json = {};
    try {
        if (!req.authToken) {
            message = 'You are not logged in.';
            return response.sc400(message, json, res);
        }

        let keterangan = req.body.keterangan || 'LOGOUT';

        if (process.env.SESSIONS === 'DATABASE') {
            // Check if the token exists
            let sqlCheck = {
                sql: "SELECT * FROM `tbl_jwt` WHERE `token` = ? AND `expired` = 'TIDAK'",
                param: [req.authToken]
            }
            let checkToken = await helper.runSQL(sqlCheck);
            if (!checkToken.length) {
                message = 'Token not found.';
                return response.sc404(message, json, res);
            }

            // SQL Update to mark the token as expired
            let sqlUpdate = {
                sql: "UPDATE `tbl_jwt` SET `expired` = ?, `keterangan` = ? WHERE `token` = ?",
                param: ['YA', keterangan, req.authToken]
            }
            await helper.runSQL(sqlUpdate);
        } else if (process.env.SESSIONS === 'REDIS') {
            const key = redisPrefix + md5(req.authToken);
            try {
                await helper.deleteKeysByPattern(key);
            } catch (redisError) {
                console.error('Session delete redis error:', redisError);
            }
        }
        return response.sc200('Your token has been deleted!', json, res);
    } catch (error) {
        console.log(error);
        return handleError(error, res);
    }
}

module.exports = Controller;