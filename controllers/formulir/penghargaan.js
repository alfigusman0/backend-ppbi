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

const redisPrefix = process.env.REDIS_PREFIX + "formulir:penghargaan:";

// Helper function to check access rights
const checkAccess = async (req, action) => {
    const sql = {
        sql: "SELECT * FROM tbs_hak_akses WHERE ids_level = ? AND ids_modul = ? AND permission LIKE ?",
        param: [req.authIdsLevel, 27, `%${action}%`]
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

        const created_by = (req.authTingkat <= 5) ? req.body.created_by || req.authIdUser : req.authIdUser;

        const {
            id_formulir,
            id_juara,
        } = req.body;

        /* Check existing data */
        let checkData = await helper.runSQL({
            sql: 'SELECT id_penghargaan FROM `tbl_penghargaan` WHERE id_formulir = ? LIMIT 1',
            param: [id_formulir],
        });

        if (checkData.length) {
            return response.sc400('Data already exists.', {}, res);
        }

        /* SQL Insert Data */
        const result = await helper.runSQL({
            sql: "INSERT INTO `tbl_penghargaan` (`id_formulir`, `id_juara`, `created_by`) VALUES (?, ?, ?)",
            param: [id_formulir, id_juara, created_by]
        });

        const json = {
            id_penghargaan: result.insertId,
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

Controller.read_bonsai = async (req, res) => {
    try {
        const hasAccess = await checkAccess(req, 'read');
        if (!hasAccess) {
            return response.sc401("Access denied.", {}, res);
        }

        const key = redisPrefix + "read:" + md5(req.originalUrl);
        const created_by = (req.authTingkat <= 5) ? req.query.created_by : req.authIdUser;
        const order_by = req.query.order_by || 'created_at DESC';

        const {
            id_penghargaan,
            id_formulir,
            nomor_sertifikat,
            id_event,
            nama_acara,
            ids_cabang,
            cabang,
            id_profile,
            nama_lengkap,
            id_bonsai,
            uuid_bonsai,
            ids_jenis_bonsai,
            jenis_bonsai,
            ids_kelas,
            nama_kelas,
            id_kategori,
            nama_kategori,
            id_juara,
            nama_juara,
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
        let sqlRead = "SELECT * FROM `view_penghargaan_pohon`";
        let sqlReadTotalData = "SELECT COUNT(id_penghargaan) as total FROM `view_penghargaan_pohon`";

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

        addCondition('id_penghargaan', id_penghargaan, 'IN');
        addCondition('id_formulir', id_formulir, 'IN');
        addCondition('nomor_sertifikat', nomor_sertifikat, 'LIKE');
        addCondition('id_event', id_event, 'IN');
        addCondition('nama_acara', nama_acara, 'LIKE');
        addCondition('ids_cabang', ids_cabang, 'IN');
        addCondition('cabang', cabang, 'LIKE');
        addCondition('id_profile', id_profile, 'IN');
        addCondition('nama_lengkap', nama_lengkap, 'LIKE');
        addCondition('id_bonsai', id_bonsai, 'IN');
        addCondition('uuid_bonsai', uuid_bonsai);
        addCondition('ids_jenis_bonsai', ids_jenis_bonsai, 'IN');
        addCondition('jenis_bonsai', jenis_bonsai, 'LIKE');
        addCondition('ids_kelas', ids_kelas, 'IN');
        addCondition('nama_kelas', nama_kelas, 'LIKE');
        addCondition('id_kategori', id_kategori, 'IN');
        addCondition('nama_kategori', nama_kategori, 'LIKE');
        addCondition('id_juara', id_juara, 'IN');
        addCondition('nama_juara', nama_juara, 'LIKE');
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

Controller.read_suiseki = async (req, res) => {
    try {
        const hasAccess = await checkAccess(req, 'read');
        if (!hasAccess) {
            return response.sc401("Access denied.", {}, res);
        }

        const key = redisPrefix + "read:" + md5(req.originalUrl);
        const created_by = (req.authTingkat <= 5) ? req.query.created_by : req.authIdUser;
        const order_by = req.query.order_by || 'created_at DESC';

        const {
            id_penghargaan,
            id_formulir,
            nomor_sertifikat,
            id_event,
            nama_acara,
            ids_cabang,
            cabang,
            id_profile,
            nama_lengkap,
            id_suiseki,
            uuid_suiseki,
            ids_jenis_suiseki,
            jenis_suiseki,
            ids_kelas,
            nama_kelas,
            id_kategori,
            nama_kategori,
            id_juara,
            nama_juara,
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
        let sqlRead = "SELECT * FROM `view_penghargaan_suiseki`";
        let sqlReadTotalData = "SELECT COUNT(id_penghargaan) as total FROM `view_penghargaan_suiseki`";

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

        addCondition('id_penghargaan', id_penghargaan, 'IN');
        addCondition('id_formulir', id_formulir, 'IN');
        addCondition('nomor_sertifikat', nomor_sertifikat, 'LIKE');
        addCondition('id_event', id_event, 'IN');
        addCondition('nama_acara', nama_acara, 'LIKE');
        addCondition('ids_cabang', ids_cabang, 'IN');
        addCondition('cabang', cabang, 'LIKE');
        addCondition('id_profile', id_profile, 'IN');
        addCondition('nama_lengkap', nama_lengkap, 'LIKE');
        addCondition('id_suiseki', id_suiseki, 'IN');
        addCondition('uuid_suiseki', uuid_suiseki);
        addCondition('ids_jenis_suiseki', ids_jenis_suiseki, 'IN');
        addCondition('jenis_suiseki', jenis_suiseki, 'LIKE');
        addCondition('ids_kelas', ids_kelas, 'IN');
        addCondition('nama_kelas', nama_kelas, 'LIKE');
        addCondition('id_kategori', id_kategori, 'IN');
        addCondition('nama_kategori', nama_kategori, 'LIKE');
        addCondition('id_juara', id_juara, 'IN');
        addCondition('nama_juara', nama_juara, 'LIKE');
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
            id_formulir,
            id_juara,
        } = req.body;

        /* Check existing data */
        let sql = 'SELECT id_penghargaan FROM `tbl_penghargaan` WHERE id_penghargaan = ?';
        const param = [id];

        if (req.authTingkat > 5) {
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

        addUpdate('id_formulir', id_formulir);
        addUpdate('id_juara', id_juara);

        // Check Data Update
        if (isEmpty(params)) {
            return response.sc400("No data has been changed.", {}, res);
        }

        addUpdate('updated_by', req.authIdUser);

        await helper.runSQL({
            sql: `UPDATE \`tbl_penghargaan\` SET ${updates.join(', ')} WHERE \`id_penghargaan\` = ?`,
            param: [...params, id]
        });

        const json = {
            id_penghargaan: id
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

        /* Check existing data */
        let sql = 'SELECT id_penghargaan FROM `tbl_penghargaan` WHERE id_penghargaan = ?';
        const param = [id];

        if (req.authTingkat > 5) {
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
            sql: 'DELETE FROM `tbl_penghargaan` WHERE id_penghargaan = ?',
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
};

Controller.single_bonsai = async (req, res) => {
    try {
        const hasAccess = await checkAccess(req, 'single');
        if (!hasAccess) {
            return response.sc401("Access denied.", {}, res);
        }

        const key = redisPrefix + "single:" + md5(req.originalUrl);
        const created_by = (req.authTingkat <= 5) ? req.query.created_by : req.authIdUser;

        const {
            id_penghargaan,
            id_formulir,
            nomor_sertifikat,
            id_event,
            nama_acara,
            ids_cabang,
            cabang,
            id_profile,
            nama_lengkap,
            id_bonsai,
            uuid_bonsai,
            ids_jenis_bonsai,
            jenis_bonsai,
            ids_kelas,
            nama_kelas,
            id_kategori,
            nama_kategori,
            id_juara,
            nama_juara,
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
        let sqlSingle = "SELECT * FROM `view_penghargaan_pohon`";
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

        addCondition('id_penghargaan', id_penghargaan);
        addCondition('id_formulir', id_formulir);
        addCondition('nomor_sertifikat', nomor_sertifikat, 'LIKE');
        addCondition('id_event', id_event);
        addCondition('nama_acara', nama_acara, 'LIKE');
        addCondition('ids_cabang', ids_cabang);
        addCondition('cabang', cabang, 'LIKE');
        addCondition('id_profile', id_profile);
        addCondition('nama_lengkap', nama_lengkap, 'LIKE');
        addCondition('id_bonsai', id_bonsai);
        addCondition('uuid_bonsai', uuid_bonsai);
        addCondition('ids_jenis_bonsai', ids_jenis_bonsai);
        addCondition('jenis_bonsai', jenis_bonsai, 'LIKE');
        addCondition('ids_kelas', ids_kelas);
        addCondition('nama_kelas', nama_kelas, 'LIKE');
        addCondition('id_kategori', id_kategori);
        addCondition('nama_kategori', nama_kategori, 'LIKE');
        addCondition('id_juara', id_juara);
        addCondition('nama_juara', nama_juara, 'LIKE');
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

Controller.single_suiseki = async (req, res) => {
    try {
        const hasAccess = await checkAccess(req, 'single');
        if (!hasAccess) {
            return response.sc401("Access denied.", {}, res);
        }

        const key = redisPrefix + "single:" + md5(req.originalUrl);
        const created_by = (req.authTingkat <= 5) ? req.query.created_by : req.authIdUser;

        const {
            id_penghargaan,
            id_formulir,
            nomor_sertifikat,
            id_event,
            nama_acara,
            ids_cabang,
            cabang,
            id_profile,
            nama_lengkap,
            id_suiseki,
            uuid_suiseki,
            ids_jenis_suiseki,
            jenis_suiseki,
            ids_kelas,
            nama_kelas,
            id_kategori,
            nama_kategori,
            id_juara,
            nama_juara,
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
        let sqlSingle = "SELECT * FROM `view_penghargaan_suiseki`";
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

        addCondition('id_penghargaan', id_penghargaan);
        addCondition('id_formulir', id_formulir);
        addCondition('nomor_sertifikat', nomor_sertifikat, 'LIKE');
        addCondition('id_event', id_event);
        addCondition('nama_acara', nama_acara, 'LIKE');
        addCondition('ids_cabang', ids_cabang);
        addCondition('cabang', cabang, 'LIKE');
        addCondition('id_profile', id_profile);
        addCondition('nama_lengkap', nama_lengkap, 'LIKE');
        addCondition('id_suiseki', id_suiseki);
        addCondition('uuid_suiseki', uuid_suiseki);
        addCondition('ids_jenis_suiseki', ids_jenis_suiseki);
        addCondition('jenis_suiseki', jenis_suiseki, 'LIKE');
        addCondition('ids_kelas', ids_kelas);
        addCondition('nama_kelas', nama_kelas, 'LIKE');
        addCondition('id_kategori', id_kategori);
        addCondition('nama_kategori', nama_kategori, 'LIKE');
        addCondition('id_juara', id_juara);
        addCondition('nama_juara', nama_juara, 'LIKE');
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