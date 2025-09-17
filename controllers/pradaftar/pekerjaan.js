/* Config */
const redis = require('../../config/redis');
/* Libraries */
const md5 = require('md5');
const moment = require('moment');
const winston = require('winston');
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

const redisPrefix = process.env.REDIS_PREFIX + "pradaftar:pekerjaan:";

// Helper function to check access rights
const checkAccess = async (req, action) => {
    const sql = {
        sql: "SELECT * FROM tbs_hak_akses WHERE ids_level = ? AND ids_modul = ? AND permission LIKE ?",
        param: [req.authIdsLevel, 55, `%${action}%`]
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

        const created_by = (req.authIdsLevel === 5) ? req.authIdUser : req.body.created_by || req.authIdUser;
        const {
            idp_formulir,
            tempat_bekerja,
            alamat_bekerja,
        } = req.body;

        /* Check existing data */
        let checkData = await helper.runSQL({
            sql: 'SELECT idp_formulir FROM `tbp_pekerjaan` WHERE idp_formulir = ? LIMIT 1',
            param: [idp_formulir],
        });
        if (checkData.length) {
            return response.sc400('Data already exists.', {}, res);
        }

        /* SQL Insert Data */
        const result = await helper.runSQL({
            sql: 'INSERT INTO `tbp_pekerjaan`(`idp_formulir`, `tempat_bekerja`, `alamat_bekerja`, `created_by`) VALUES (?, ?, ?, ?)',
            param: [idp_formulir, tempat_bekerja, alamat_bekerja, created_by],
        });

        const json = {
            idp_formulir: idp_formulir,
            idp_pekerjaan: result.insertId,
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

        const key = redisPrefix + "read:" + md5(req.authToken + req.originalUrl);
        const order_by = req.query.order_by || 'date_created DESC';
        const created_by = (req.authIdsLevel == "5") ? req.authIdUser : req.query.created_by;
        const {
            idp_pekerjaan,
            idp_formulir,
            nomor_peserta,
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
        let sqlRead = "SELECT * FROM `tbp_pekerjaan`";
        let sqlReadTotalData = "SELECT COUNT(idp_pekerjaan) as total FROM `tbp_pekerjaan`";
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

        addCondition('idp_pekerjaan', idp_pekerjaan);
        addCondition('idp_formulir', idp_formulir);
        addCondition('created_by', created_by);

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

        const id = req.params.id;
        const created_by = (req.authIdsLevel === 5) ? req.authIdUser : req.body.created_by;
        const {
            idp_formulir,
            tempat_bekerja,
            alamat_bekerja,
        } = req.body;

        /* Check existing data */
        let sql = 'SELECT idp_pekerjaan FROM `tbp_pekerjaan` WHERE idp_pekerjaan = ?';
        const param = [id];
        if (req.authIdsLevel == "5") {
            sql += ' AND created_by = ?';
            param.push(req.authIdUser);
        }
        sql += ' LIMIT 1';
        const checkData = await helper.runSQL({
            sql,
            param
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

        addUpdate('idp_formulir', idp_formulir);
        addUpdate('tempat_bekerja', tempat_bekerja);
        addUpdate('alamat_bekerja', alamat_bekerja);
        addUpdate('created_by', created_by);

        // Check Data Update
        if (isEmpty(params)) {
            return response.sc400("No data has been changed.", {}, res);
        }

        addUpdate('updated_by', req.authIdUser);
        await helper.runSQL({
            sql: `UPDATE tbp_pekerjaan SET ${updates.join(', ')} WHERE idp_pekerjaan = ?`,
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

        const id = req.params.id;

        /* Check existing data */
        let sql = 'SELECT idp_pekerjaan FROM `tbp_pekerjaan` WHERE idp_pekerjaan = ?';
        const param = [id];
        if (req.authIdsLevel == "5") {
            sql += ' AND created_by = ?';
            param.push(req.authIdUser);
        }
        sql += ' LIMIT 1';
        const checkData = await helper.runSQL({
            sql,
            param
        });
        if (!checkData.length) {
            return response.sc404('Data not found.', {}, res);
        }

        // SQL Delete Data
        await helper.runSQL({
            sql: 'DELETE FROM `tbp_pekerjaan` WHERE idp_pekerjaan = ?',
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

        const key = redisPrefix + "single:" + md5(req.authToken + req.originalUrl);
        const created_by = (req.authIdsLevel == "5") ? req.authIdUser : req.query.created_by;
        const {
            idp_pekerjaan,
            idp_formulir,
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
        let sqlSingle = "SELECT * FROM `tbp_pekerjaan`";
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

        addCondition('idp_pekerjaan', idp_pekerjaan);
        addCondition('idp_formulir', idp_formulir);
        addCondition('created_by', created_by);

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