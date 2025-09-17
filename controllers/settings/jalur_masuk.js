/* Config */
const redis = require('../../config/redis');
/* Libraries */
const winston = require('winston');
const md5 = require('md5');
const DailyRotateFile = require('winston-daily-rotate-file');
/* Helpers */
const helper = require('../../helpers/helper');
const response = require('../../helpers/response');
const isEmpty = require('../../validation/is-empty');
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

const redisPrefix = process.env.REDIS_PREFIX + "settings:jalur_masuk:";

// Helper function to check access rights
const checkAccess = async (req, action) => {
    const sql = {
        sql: "SELECT * FROM tbs_hak_akses WHERE ids_level = ? AND ids_modul = ? AND permission LIKE ?",
        param: [req.authIdsLevel, 10, `%${action}%`]
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

        const {
            ids_jalur_masuk,
        } = req.body;
        const pendaftaran_awal = helper.convertoDateTime(req.body.pendaftaran_awal);
        const pendaftaran_akhir = helper.convertoDateTime(req.body.pendaftaran_akhir);
        const ukt_awal = helper.convertoDateTime(req.body.ukt_awal);
        const ukt_akhir = helper.convertoDateTime(req.body.ukt_akhir);
        const pembayaran_awal = helper.convertoDateTime(req.body.pembayaran_awal);
        const pembayaran_akhir = helper.convertoDateTime(req.body.pembayaran_akhir);
        const pemberkasan_awal = helper.convertoDateTime(req.body.pemberkasan_awal);
        const pemberkasan_akhir = helper.convertoDateTime(req.body.pemberkasan_akhir);

        // Check existing data
        const checkData = await helper.runSQL({
            sql: 'SELECT ids_jalur_masuk FROM `tbs_jalur_masuk` WHERE ids_jalur_masuk = ? LIMIT 1',
            param: [ids_jalur_masuk],
        });
        if (checkData.length) {
            return response.sc400('Data already exists.', {}, res);
        }

        const sqlInsert = {
            sql: "INSERT INTO `tbs_jalur_masuk`(`ids_jalur_masuk`, `pendaftaran_awal`, `pendaftaran_akhir`, `ukt_awal`, `ukt_akhir`, `pembayaran_awal`, `pembayaran_akhir`, `pemberkasan_awal`, `pemberkasan_akhir`, `created_by`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            param: [ids_jalur_masuk, pendaftaran_awal, pendaftaran_akhir, ukt_awal, ukt_akhir, pembayaran_awal, pembayaran_akhir, pemberkasan_awal, pemberkasan_akhir, req.authIdUser]
        };

        const result = await helper.runSQL(sqlInsert);
        const json = {
            ids_jalur_masuk: result.insertId
        };

        // Hapus cache Redis
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
};

Controller.read = async (req, res) => {
    try {
        const hasAccess = await checkAccess(req, 'read');
        if (!hasAccess) {
            return response.sc401("Access denied.", {}, res);
        }

        const {
            ids_jalur_masuk,
            jalur_masuk,
            alias_jalur_masuk,
            pendaftaran_awal,
            pendaftaran_akhir,
            ukt_awal,
            ukt_akhir,
            pembayaran_awal,
            pembayaran_akhir,
            pemberkasan_awal,
            pemberkasan_akhir,
        } = req.query;
        const order_by = req.query.order_by || 'date_created ASC';
        const key = redisPrefix + "read:" + md5(req.originalUrl);

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
        let sqlRead = "SELECT * FROM `views_jalur_masuk`";
        let sqlReadTotalData = "SELECT COUNT(ids_jalur_masuk) as total FROM `views_jalur_masuk`";
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

        addCondition('ids_jalur_masuk', ids_jalur_masuk);
        addCondition('jalur_masuk', jalur_masuk, 'LIKE');
        addCondition('alias_jalur_masuk', alias_jalur_masuk, 'LIKE');
        addCondition('pendaftaran_awal', pendaftaran_awal, '>=');
        addCondition('pendaftaran_akhir', pendaftaran_akhir, '<=');
        addCondition('ukt_awal', ukt_awal, '>=');
        addCondition('ukt_akhir', ukt_akhir, '<=');
        addCondition('pembayaran_awal', pembayaran_awal, '>=');
        addCondition('pembayaran_akhir', pembayaran_akhir, '<=');
        addCondition('pemberkasan_awal', pemberkasan_awal, '>=');
        addCondition('pemberkasan_akhir', pemberkasan_akhir, '<=');

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

        getData.forEach(item => {
            item.pendaftaran_awal = helper.convertoDateTime(item.pendaftaran_awal);
            item.pendaftaran_akhir = helper.convertoDateTime(item.pendaftaran_akhir);
            item.ukt_awal = helper.convertoDateTime(item.ukt_awal);
            item.ukt_akhir = helper.convertoDateTime(item.ukt_akhir);
            item.pembayaran_awal = helper.convertoDateTime(item.pembayaran_awal);
            item.pembayaran_akhir = helper.convertoDateTime(item.pembayaran_akhir);
            item.pemberkasan_awal = helper.convertoDateTime(item.pemberkasan_awal);
            item.pemberkasan_akhir = helper.convertoDateTime(item.pemberkasan_akhir);
        });

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
};

Controller.update = async (req, res) => {
    try {
        const hasAccess = await checkAccess(req, 'update');
        if (!hasAccess) {
            return response.sc401("Access denied.", {}, res);
        }

        const id = req.params.id;
        const {
            ids_jalur_masuk,
        } = req.body;
        const pendaftaran_awal = helper.convertoDateTime(req.body.pendaftaran_awal);
        const pendaftaran_akhir = helper.convertoDateTime(req.body.pendaftaran_akhir);
        const ukt_awal = helper.convertoDateTime(req.body.ukt_awal);
        const ukt_akhir = helper.convertoDateTime(req.body.ukt_akhir);
        const pembayaran_awal = helper.convertoDateTime(req.body.pembayaran_awal);
        const pembayaran_akhir = helper.convertoDateTime(req.body.pembayaran_akhir);
        const pemberkasan_awal = helper.convertoDateTime(req.body.pemberkasan_awal);
        const pemberkasan_akhir = helper.convertoDateTime(req.body.pemberkasan_akhir);

        // Check existing data
        const checkData = await helper.runSQL({
            sql: 'SELECT ids_jalur_masuk FROM `tbs_jalur_masuk` WHERE ids_jalur_masuk = ? LIMIT 1',
            param: [id],
        });

        if (!checkData.length) {
            return response.sc404('Data not found.', {}, res);
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

        addUpdate('ids_jalur_masuk', ids_jalur_masuk);
        addUpdate('pendaftaran_awal', pendaftaran_awal);
        addUpdate('pendaftaran_akhir', pendaftaran_akhir);
        addUpdate('ukt_awal', ukt_awal);
        addUpdate('ukt_akhir', ukt_akhir);
        addUpdate('pembayaran_awal', pembayaran_awal);
        addUpdate('pembayaran_akhir', pembayaran_akhir);
        addUpdate('pemberkasan_awal', pemberkasan_awal);
        addUpdate('pemberkasan_akhir', pemberkasan_akhir);

        // Check Data Update
        if (isEmpty(params)) {
            return response.sc400("No data has been changed.", {}, res);
        }

        /* addUpdate('updated_by', req.authIdUser); */
        const sqlUpdate = {
            sql: `UPDATE \`tbs_jalur_masuk\` SET ${updates.join(', ')} WHERE \`ids_jalur_masuk\` = ?`,
            param: [...params, id]
        };

        await helper.runSQL(sqlUpdate);
        const json = {
            ids_jalur_masuk: id
        };

        // Hapus cache Redis
        try {
            await helper.deleteKeysByPattern(redisPrefix + '*');
        } catch (redisError) {
            logger.error('Failed to delete Redis cache in update:', redisError);
        }

        return response.sc200('Data changed successfully.', json, res);
    } catch (error) {
        console.log(error);
        return handleError(error, res);
    }
};

Controller.delete = async (req, res) => {
    try {
        const hasAccess = await checkAccess(req, 'delete');
        if (!hasAccess) {
            return response.sc401("Access denied.", {}, res);
        }

        const id = req.params.id;

        // Check existing data
        const checkData = await helper.runSQL({
            sql: 'SELECT ids_jalur_masuk FROM `tbs_jalur_masuk` WHERE ids_jalur_masuk = ? LIMIT 1',
            param: [id],
        });

        if (!checkData.length) {
            return response.sc404('Data not found.', {}, res);
        }

        // SQL Delete Data
        const sqlDelete = {
            sql: 'DELETE FROM `tbs_jalur_masuk` WHERE ids_jalur_masuk = ?',
            param: [id],
        };

        await helper.runSQL(sqlDelete);

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
};

Controller.single = async (req, res) => {
    try {
        const hasAccess = await checkAccess(req, 'single');
        if (!hasAccess) {
            return response.sc401("Access denied.", {}, res);
        }

        const {
            ids_jalur_masuk,
            jalur_masuk,
            alias_jalur_masuk,
            pendaftaran_awal,
            pendaftaran_akhir,
            ukt_awal,
            ukt_akhir,
            pembayaran_awal,
            pembayaran_akhir,
            pemberkasan_awal,
            pemberkasan_akhir,
        } = req.query;
        const key = redisPrefix + "single:" + md5(req.originalUrl);

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
        let sqlSingle = "SELECT * FROM `views_jalur_masuk`";
        const params = [];

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
                } else {
                    // Existing logic for other operators
                    condition = `${field} ${operator} ?`;
                    paramValue = operator === 'LIKE' ? `%${value}%` : value;
                    params.push(paramValue);
                }

                sqlSingle += sqlSingle.includes('WHERE') ? ` AND ${condition}` : ` WHERE ${condition}`;
            }
        };

        addCondition('ids_jalur_masuk', ids_jalur_masuk);
        addCondition('jalur_masuk', jalur_masuk, 'LIKE');
        addCondition('alias_jalur_masuk', alias_jalur_masuk, 'LIKE');
        addCondition('pendaftaran_awal', pendaftaran_awal, '>=');
        addCondition('pendaftaran_akhir', pendaftaran_akhir, '<=');
        addCondition('ukt_awal', ukt_awal, '>=');
        addCondition('ukt_akhir', ukt_akhir, '<=');
        addCondition('pembayaran_awal', pembayaran_awal, '>=');
        addCondition('pembayaran_akhir', pembayaran_akhir, '<=');
        addCondition('pemberkasan_awal', pemberkasan_awal, '>=');
        addCondition('pemberkasan_akhir', pemberkasan_akhir, '<=');

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

        getData[0].pendaftaran_awal = helper.convertoDateTime(getData[0].pendaftaran_awal);
        getData[0].pendaftaran_akhir = helper.convertoDateTime(getData[0].pendaftaran_akhir);
        getData[0].ukt_awal = helper.convertoDateTime(getData[0].ukt_awal);
        getData[0].ukt_akhir = helper.convertoDateTime(getData[0].ukt_akhir);
        getData[0].pembayaran_awal = helper.convertoDateTime(getData[0].pembayaran_awal);
        getData[0].pembayaran_akhir = helper.convertoDateTime(getData[0].pembayaran_akhir);
        getData[0].pemberkasan_awal = helper.convertoDateTime(getData[0].pemberkasan_awal);
        getData[0].pemberkasan_akhir = helper.convertoDateTime(getData[0].pemberkasan_akhir);

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
};

module.exports = Controller;