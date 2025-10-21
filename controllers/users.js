/* Config */
const encrypt = require('../config/encrypt');
const redis = require('../config/redis');
/* Libraries */
const md5 = require('md5');
const moment = require('moment');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

/* Helpers */
const helper = require('../helpers/helper');
const response = require('../helpers/response');
const isEmpty = require('../validation/is-empty');
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

const redisPrefix = process.env.REDIS_PREFIX + "users:";

// Helper function to check access rights
const checkAccess = async (req, action) => {
    const sql = {
        sql: "SELECT * FROM tbs_hak_akses WHERE ids_level = ? AND ids_modul = ? AND permission LIKE ?",
        param: [req.authIdsLevel, 2, `%${action}%`]
    };
    const result = await helper.runSQL(sql);
    return result.length > 0;
};

// Helper function to handle errors
const handleError = (error, res) => {
    logger.error(error);
    return response.sc500('An error occurred in the system, please try again.', {}, res);
};

Controller.create = async (req, res) => {
    try {
        const hasAccess = await checkAccess(req, 'create');
        if (!hasAccess) {
            return response.sc401("Access denied.", {}, res);
        }

        const created_by = (req.authTingkat <= 5) ? req.body.created_by : req.authIdUser;
        const reset = req.body.reset || 'TIDAK';
        const {
            ids_grup,
            username,
        } = req.body;
        const hashedPassword = await encrypt.Hash(req.body.password);

        /* Check existing data */
        if (!isEmpty(username)) {
            let checkData = await helper.runSQL({
                sql: 'SELECT username FROM `tbl_users` WHERE username = ? LIMIT 1',
                param: [username],
            });
            if (checkData.length) {
                return response.sc400('Data already exists.', {}, res);
            }
        }

        /* SQL Insert Data */
        const result = await helper.runSQL({
            sql: "INSERT INTO `tbl_users` (`ids_grup`, `username`, `password`, `reset`, `created_by`) VALUES (?, ?, ?, ?, ?)",
            param: [ids_grup, username, hashedPassword, reset, created_by]
        });

        json = {
            id_user: result.insertId,
        }

        try {
            await helper.deleteKeysByPattern(redisPrefix + '*');
        } catch (redisError) {
            logger.error('Failed to delete Redis cache in create:', redisError);
        }

        return response.sc200('Data added successfully.', json, res);
    } catch (error) {
        console.log(error);
        return handleError(error, res);
    }

}

Controller.read = async (req, res) => {
    try {
        const hasAccess = await checkAccess(req, 'read');
        if (!hasAccess) {
            return response.sc401("Access denied.", {}, res);
        }

        const id_user = (req.authTingkat > 2) ? req.authIdUser : req.query.id_user;
        const tingkat = (req.authIdsLevel > 2) ? req.authTingkat : req.query.tingkat;
        const order_by = req.query.order_by || 'created_at DESC';
        const key = redisPrefix + "read:" + md5(req.authToken + req.originalUrl);
        const {
            username,
            ids_level,
            level,
            ids_grup,
            grup,
            keterangan,
            reset,
        } = req.query;

        // Check Redis cache
        let cache = null;
        if (process.env.REDIS_ACTIVE === "ON") {
            try {
                cache = await redis.get(key);
                if (cache) {
                    return response.sc200('Data from cache.', JSON.parse(cache), res);
                }
            } catch (redisError) {
                logger.error('Redis get error:', redisError);
            }
        }

        // Pagination
        const resPerPage = parseInt(req.query.limit) || parseInt(process.env.LIMIT_DATA || 10); // Default 10
        const page = (parseInt(req.query.page) || 1) - 1; // Pastikan page tidak negatif
        const currentPage = parseInt(req.query.page) || 1;

        // Build SQL query
        let sqlRead = "SELECT * FROM `view_grup_users`";
        let sqlReadTotalData = "SELECT COUNT(id_user) as total FROM `view_grup_users`";
        const params = [];
        const totalParams = [];

        const addCondition = (field, value, operator = '=') => {
            if (!isEmpty(value)) {
                let condition;
                let paramValue = value;

                if (['IN', 'NOT IN'].includes(operator)) {
                    // Handle comma-separated string or array input
                    if (typeof value === 'string') {
                        paramValue = value.split(',').map(item => item.trim());
                    } else if (!Array.isArray(value)) {
                        paramValue = [value];
                    }
                    // Create placeholders for IN/NOT IN clause
                    condition = `${field} ${operator} (${paramValue.map(() => '?').join(', ')})`;
                    // Spread array values into params
                    params.push(...paramValue);
                    totalParams.push(...paramValue);
                } else {
                    // Existing logic for other operators
                    condition = `${field} ${operator} ?`;
                    paramValue = operator === 'LIKE' ? `%${value}%` : value;
                    params.push(paramValue);
                    totalParams.push(paramValue);
                }

                sqlRead += sqlRead.includes('WHERE') ? ` AND ${condition}` : ` WHERE ${condition}`;
                sqlReadTotalData += sqlReadTotalData.includes('WHERE') ? ` AND ${condition}` : ` WHERE ${condition}`;
            }
        };

        addCondition('id_user', id_user);
        addCondition('username', username);
        addCondition('ids_level', ids_level, 'IN');
        addCondition('level', level, 'LIKE');
        addCondition('tingkat', tingkat, '>=');
        addCondition('ids_grup', ids_grup, 'IN');
        addCondition('grup', grup, 'LIKE');
        addCondition('keterangan', keterangan, 'LIKE');
        addCondition('reset', reset);

        sqlRead += ` ORDER BY ${order_by} LIMIT ?, ?`;
        params.push(page * resPerPage, resPerPage);

        // Execute queries
        const [getData, getTotalData] = await Promise.all([
            helper.runSQL({
                sql: sqlRead,
                param: params
            }),
            helper.runSQL({
                sql: sqlReadTotalData,
                param: totalParams
            })
        ]);

        if (!getData.length) {
            return response.sc404('Data not found.', {}, res);
        }

        const pagination = helper.getPagination(getTotalData, resPerPage, currentPage);
        const json = {
            data: getData,
            pagination
        };

        // Set Redis cache
        if (process.env.REDIS_ACTIVE === "ON") {
            try {
                await redis.set(key, JSON.stringify(json), 'EX', 60 * 60 * 24 * (process.env.REDIS_DAY || 1)); // Default 1 hari
            } catch (redisError) {
                logger.error('Redis error:', redisError);
            }
        }

        return response.sc200('', json, res);
    } catch (error) {
        console.log(error);
        return handleError(error, res);
    }
}

Controller.update = async (req, res) => {
    try {
        const hasAccess = await checkAccess(req, 'update');
        if (!hasAccess) {
            return response.sc401("Access denied.", {}, res);
        }

        const id = (req.authIdsLevel === '5') ? req.authIdUser : req.params.id;
        const {
            ids_grup,
            username,
            password,
            reset,
        } = req.body;

        /* Check existing data */
        const checkData = await helper.runSQL({
            sql: 'SELECT id_user FROM `tbl_users` WHERE id_user = ?  LIMIT 1',
            param: [id],
        });
        if (!checkData.length) {
            return response.sc404('Data not found.', {}, res);
        }

        const checkUsername = await helper.runSQL({
            sql: 'SELECT id_user FROM `tbl_users` WHERE username = ? AND id_user != ? LIMIT 1',
            param: [username, id],
        });
        if (checkUsername.length) {
            return response.sc400('Username already exist.', {}, res);
        }

        if (checkData[0].tingkat < req.authTingkat) {
            return response.sc400('You are not allowed to update this data.', {}, res);
        }

        /* Hash Password */
        let hashedPassword = '';
        if (!isEmpty(password)) {
            hashedPassword = await encrypt.Hash(password);
        }

        // Build SQL update query
        const updates = [];
        const params = [];

        const addUpdate = (field, value) => {
            if (!isEmpty(value)) {
                updates.push(`${field} = ?`);
                params.push(value);
            }
        };

        addUpdate('ids_grup', ids_grup);
        addUpdate('username', username);
        addUpdate('password', hashedPassword);
        addUpdate('reset', reset);

        // Check Data Update
        if (isEmpty(params)) {
            return response.sc400("No data has been changed.", {}, res);
        }

        addUpdate('updated_by', req.authIdUser);
        await helper.runSQL({
            sql: `UPDATE tbl_users SET ${updates.join(', ')} WHERE id_user = ?`,
            param: [...params, id],
        });

        // Hapus cache Redis
        try {
            await helper.deleteKeysByPattern(redisPrefix + '*');
        } catch (redisError) {
            logger.error('Failed to delete Redis cache in update:', redisError);
        }

        return response.sc200('Data changed successfully.', {}, res);
    } catch (error) {
        console.log(error);
        return handleError(error, res);
    }
}

Controller.delete = async (req, res) => {
    try {
        const hasAccess = await checkAccess(req, 'delete');
        if (!hasAccess) {
            return response.sc401("Access denied.", {}, res);
        }

        const id = (req.authIdsLevel === '5') ? req.authIdUser : req.params.id;

        /* Check existing data */
        const checkData = await helper.runSQL({
            sql: 'SELECT id_user FROM `tbl_users` WHERE id_user = ?  LIMIT 1',
            param: [id],
        });
        if (!checkData.length) {
            return response.sc404('Data not found.', {}, res);
        }

        if (checkData[0].tingkat < req.authTingkat) {
            return response.sc400('You are not allowed to update this data.', {}, res);
        }

        // SQL Delete Data
        await helper.runSQL({
            sql: 'DELETE FROM `tbl_users` WHERE id_user = ?',
            param: [id],
        });

        // Hapus cache Redis
        try {
            await helper.deleteKeysByPattern(redisPrefix + '*');
        } catch (redisError) {
            logger.error('Failed to delete Redis cache in delete:', redisError);
        }
        return response.sc200('Data deleted successfully.', {}, res);
    } catch (error) {
        console.log(error);
        return handleError(error, res);
    }
}

Controller.single = async (req, res) => {
    try {
        const hasAccess = await checkAccess(req, 'single');
        if (!hasAccess) {
            return response.sc401("Access denied.", {}, res);
        }

        const id_user = (req.authIdsLevel > 2) ? req.authIdUser : req.query.id_user;
        const tingkat = (req.authIdsLevel > 2) ? req.authTingkat : req.query.tingkat;
        const key = redisPrefix + "single:" + md5(req.authToken + req.originalUrl);
        const {
            username,
            ids_level,
            level,
            ids_grup,
            grup,
            keterangan,
            reset,
        } = req.query;

        // Check Redis cache
        let cache = null;
        if (process.env.REDIS_ACTIVE === "ON") {
            try {
                cache = await redis.get(key);
                if (cache) {
                    return response.sc200('Data from cache.', JSON.parse(cache), res);
                }
            } catch (redisError) {
                logger.error('Redis get error:', redisError);
            }
        }

        // Build SQL query
        let sqlSingle = "SELECT * FROM `view_grup_users`";
        const params = [];

        const addCondition = (field, value, operator = '=') => {
            if (!isEmpty(value)) {
                const condition = `${field} ${operator} ?`;
                sqlSingle += sqlSingle.includes('WHERE') ? ` AND ${condition}` : ` WHERE ${condition}`;
                params.push(operator === 'LIKE' ? `%${value}%` : value);
            }
        };

        addCondition('id_user', id_user);
        addCondition('username', username);
        addCondition('ids_level', ids_level, 'IN');
        addCondition('level', level, 'LIKE');
        addCondition('tingkat', tingkat, '>=');
        addCondition('ids_grup', ids_grup, 'IN');
        addCondition('grup', grup, 'LIKE');
        addCondition('keterangan', keterangan, 'LIKE');
        addCondition('reset', reset);

        // Limit to 1 row
        sqlSingle += ' LIMIT 1';

        // Execute query
        const getData = await helper.runSQL({
            sql: sqlSingle,
            param: params
        });

        if (!getData.length) {
            return response.sc404('Data not found.', {}, res);
        }

        const json = getData[0];

        // Set Redis cache
        if (process.env.REDIS_ACTIVE === "ON") {
            try {
                await redis.set(key, JSON.stringify(json), 'EX', 60 * 60 * 24 * (process.env.REDIS_DAY || 1)); // Default 1 hari
            } catch (redisError) {
                logger.error('Redis error:', redisError);
            }
        }

        return response.sc200('', json, res);
    } catch (error) {
        console.log(error);
        return handleError(error, res);
    }
}

module.exports = Controller;