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

const redisPrefix = process.env.REDIS_PREFIX + "settings:kelurahan:";

// Helper function to check access rights
const checkAccess = async (req, action) => {
    const sql = {
        sql: "SELECT * FROM tbs_hak_akses WHERE ids_level = ? AND ids_modul = ? AND permission LIKE ?",
        param: [req.authIdsLevel, 11, `%${action}%`]
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
            kode_kelurahan,
            ids_kecamatan,
            kelurahan,
            status,
        } = req.body;

        // Check existing data
        const checkData = await helper.runSQL({
            sql: 'SELECT kode_kelurahan FROM `tbs_kelurahan` WHERE kode_kelurahan = ? LIMIT 1',
            param: [kode_kelurahan],
        });
        if (checkData.length) {
            return response.sc400('Data already exists.', {}, res);
        }

        const sqlInsert = {
            sql: "INSERT INTO `tbs_kelurahan`(`kode_kelurahan`, `ids_kecamatan`, `kelurahan`, `status`, `created_by`) VALUES (?, ?, ?, ?, ?)",
            param: [kode_kelurahan, ids_kecamatan, kelurahan, status, req.authIdUser]
        };

        const result = await helper.runSQL(sqlInsert);
        const json = {
            ids_kelurahan: result.insertId
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
            ids_provinsi,
            kode_provinsi,
            provinsi,
            pulau,
            ids_kabkota,
            kode_kabkota,
            kabkota,
            ids_kecamatan,
            kode_kecamatan,
            kecamatan,
            ids_kelurahan,
            kode_kelurahan,
            kelurahan,
            status,
        } = req.query;
        const order_by = req.query.order_by || 'created_at ASC';
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
        let sqlRead = "SELECT * FROM `views_kelurahan`";
        let sqlReadTotalData = "SELECT COUNT(kode_kelurahan) as total FROM `views_kelurahan`";
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

        addCondition('ids_provinsi', ids_provinsi, 'IN');
        addCondition('kode_provinsi', kode_provinsi, 'IN');
        addCondition('provinsi', provinsi, 'LIKE');
        addCondition('pulau', pulau, 'IN');
        addCondition('ids_kabkota', ids_kabkota, 'IN');
        addCondition('kode_kabkota', kode_kabkota, 'IN');
        addCondition('kabkota', kabkota, 'LIKE');
        addCondition('ids_kecamatan', ids_kecamatan, 'IN');
        addCondition('kode_kecamatan', kode_kecamatan, 'IN');
        addCondition('kecamatan', kecamatan, 'LIKE');
        addCondition('ids_kelurahan', ids_kelurahan, 'IN');
        addCondition('kode_kelurahan', kode_kelurahan, 'IN');
        addCondition('kelurahan', kelurahan, 'LIKE');
        addCondition('status', status);

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
};

Controller.update = async (req, res) => {
    try {
        const hasAccess = await checkAccess(req, 'update');
        if (!hasAccess) {
            return response.sc401("Access denied.", {}, res);
        }

        const id = req.params.id;
        const {
            kode_kelurahan,
            ids_kecamatan,
            kelurahan,
            status,
        } = req.body;

        // Check existing data
        const checkData = await helper.runSQL({
            sql: 'SELECT ids_kelurahan FROM `tbs_kelurahan` WHERE ids_kelurahan = ? LIMIT 1',
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

        addUpdate('kode_kelurahan', kode_kelurahan);
        addUpdate('ids_kecamatan', ids_kecamatan);
        addUpdate('kelurahan', kelurahan);
        addUpdate('status', status);

        // Check Data Update
        if (isEmpty(params)) {
            return response.sc400("No data has been changed.", {}, res);
        }

        addUpdate('updated_by', req.authIdUser);
        const sqlUpdate = {
            sql: `UPDATE \`tbs_kelurahan\` SET ${updates.join(', ')} WHERE \`ids_kelurahan\` = ?`,
            param: [...params, id]
        };

        await helper.runSQL(sqlUpdate);
        const json = {
            ids_kelurahan: id
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
            sql: 'SELECT ids_kelurahan FROM `tbs_kelurahan` WHERE ids_kelurahan = ? LIMIT 1',
            param: [id],
        });

        if (!checkData.length) {
            return response.sc404('Data not found.', {}, res);
        }

        // SQL Delete Data
        const sqlDelete = {
            sql: 'DELETE FROM `tbs_kelurahan` WHERE ids_kelurahan = ?',
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
            ids_provinsi,
            kode_provinsi,
            provinsi,
            pulau,
            ids_kabkota,
            kode_kabkota,
            kabkota,
            ids_kecamatan,
            kode_kecamatan,
            kecamatan,
            ids_kelurahan,
            kode_kelurahan,
            kelurahan,
            status,
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
        let sqlSingle = "SELECT * FROM `views_kelurahan`";
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

        addCondition('ids_provinsi', ids_provinsi);
        addCondition('kode_provinsi', kode_provinsi);
        addCondition('provinsi', provinsi, 'LIKE');
        addCondition('pulau', pulau);
        addCondition('ids_kabkota', ids_kabkota);
        addCondition('kode_kabkota', kode_kabkota);
        addCondition('kabkota', kabkota, 'LIKE');
        addCondition('ids_kecamatan', ids_kecamatan);
        addCondition('kode_kecamatan', kode_kecamatan);
        addCondition('kecamatan', kecamatan, 'LIKE');
        addCondition('ids_kelurahan', ids_kelurahan);
        addCondition('kode_kelurahan', kode_kelurahan);
        addCondition('kelurahan', kelurahan, 'LIKE');
        addCondition('status', status);

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
};

module.exports = Controller;