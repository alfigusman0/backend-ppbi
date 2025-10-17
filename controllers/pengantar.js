/* Config */
const redis = require('../config/redis');
/* Libraries */
const winston = require('winston');
const md5 = require('md5');
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

const redisPrefix = process.env.REDIS_PREFIX + "pengantar:";

// Helper function to check access rights
const checkAccess = async (req, action) => {
    const sql = {
        sql: "SELECT * FROM tbs_hak_akses WHERE ids_level = ? AND ids_modul = ? AND permission LIKE ?",
        param: [req.authIdsLevel, 26, `%${action}%`]
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
        const {
            pengantar_nama,
            pengantar_alamat,
            pengantar_handphone,
            pengantar_fotoktp,
            pengantar_fotosuratpernyataan,
        } = req.body;

        const sqlInsert = {
            sql: "INSERT INTO `tbl_pengantar`(`pengantar_nama`, `pengantar_alamat`, `pengantar_handphone`, `pengantar_fotoktp`, `pengantar_fotosuratpernyataan`, `created_by`) VALUES (?, ?, ?, ?, ?, ?)",
            param: [pengantar_nama, pengantar_alamat, pengantar_handphone, pengantar_fotoktp, pengantar_fotosuratpernyataan, created_by]
        };

        const result = await helper.runSQL(sqlInsert);
        const json = {
            id_pengantar: result.insertId
        };

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

        const key = redisPrefix + "read:" + md5(req.originalUrl);
        const created_by = (req.authTingkat <= 5) ? req.query.created_by : req.authIdUser;
        const order_by = req.query.order_by || 'created_at DESC';
        const {
            id_pengantar,
            pengantar_nama,
            pengantar_handphone,
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
        let sqlRead = "SELECT * FROM `tbl_pengantar`";
        let sqlReadTotalData = "SELECT COUNT(id_pengantar) as total FROM `tbl_pengantar`";
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

        addCondition('id_pengantar', id_pengantar, 'IN');
        addCondition('pengantar_nama', pengantar_nama, 'LIKE');
        addCondition('pengantar_handphone', pengantar_handphone, 'LIKE');
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
};

Controller.update = async (req, res) => {
    try {
        const hasAccess = await checkAccess(req, 'update');
        if (!hasAccess) {
            return response.sc401("Access denied.", {}, res);
        }

        const id = req.params.id;
        const {
            pengantar_nama,
            pengantar_alamat,
            pengantar_handphone,
            pengantar_fotoktp,
            pengantar_fotosuratpernyataan,
        } = req.body;

        // Check existing data
        const checkData = await helper.runSQL({
            sql: 'SELECT id_pengantar FROM `tbl_pengantar` WHERE id_pengantar = ? LIMIT 1',
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

        addUpdate('pengantar_nama', pengantar_nama);
        addUpdate('pengantar_alamat', pengantar_alamat);
        addUpdate('pengantar_handphone', pengantar_handphone);
        addUpdate('pengantar_fotoktp', pengantar_fotoktp);
        addUpdate('pengantar_fotosuratpernyataan', pengantar_fotosuratpernyataan);

        // Check Data Update
        if (isEmpty(params)) {
            return response.sc400("No data has been changed.", {}, res);
        }

        addUpdate('updated_by', req.authIdUser);
        const sqlUpdate = {
            sql: `UPDATE \`tbl_pengantar\` SET ${updates.join(', ')} WHERE \`id_pengantar\` = ?`,
            param: [...params, id]
        };

        await helper.runSQL(sqlUpdate);
        const json = {
            id_pengantar: id
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
            sql: 'SELECT id_pengantar FROM `tbl_pengantar` WHERE id_pengantar = ? LIMIT 1',
            param: [id],
        });

        if (!checkData.length) {
            return response.sc404('Data not found.', {}, res);
        }

        // SQL Delete Data
        const sqlDelete = {
            sql: 'DELETE FROM `tbl_pengantar` WHERE id_pengantar = ?',
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

        const key = redisPrefix + "single:" + md5(req.originalUrl);
        const created_by = (req.authTingkat <= 5) ? req.query.created_by : req.authIdUser;
        const {
            id_pengantar,
            pengantar_nama,
            pengantar_handphone,
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
        let sqlSingle = "SELECT * FROM `tbl_pengantar`";
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

        addCondition('id_pengantar', id_pengantar);
        addCondition('pengantar_nama', pengantar_nama, 'LIKE');
        addCondition('pengantar_handphone', pengantar_handphone, 'LIKE');
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
};

module.exports = Controller;