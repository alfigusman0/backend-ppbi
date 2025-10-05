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

const redisPrefix = process.env.REDIS_PREFIX + "event:acara:";

// Helper function to check access rights
const checkAccess = async (req, action) => {
    const sql = {
        sql: "SELECT * FROM tbs_hak_akses WHERE ids_level = ? AND ids_modul = ? AND permission LIKE ?",
        param: [req.authIdsLevel, 16, `%${action}%`]
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

        const tgl_awal_acara = helper.convertoDate(req.body.tgl_awal_acara);
        const tgl_akhir_acara = helper.convertoDate(req.body.tgl_akhir_acara);
        const {
            ids_cabang,
            nama_acara,
            slug_event,
            proposal,
            ids_kelurahan,
            rw,
            rt,
            alamat,
            poster,
            bukti_bayar,
            status,
        } = req.body;

        /* Check existing data */
        let checkData = await helper.runSQL({
            sql: 'SELECT ids_cabang FROM `tbl_event` WHERE slug_event = ? LIMIT 1',
            param: [slug_event],
        });
        if (checkData.length) {
            return response.sc400('Data already exists.', {}, res);
        }

        /* SQL Insert Data */
        const result = await helper.runSQL({
            sql: "INSERT INTO `tbl_event` (`ids_cabang`, `nama_acara`, `slug_event`, `proposal`, `tgl_awal_acara`, `tgl_akhir_acara`, `ids_kelurahan`, `rw`, `rt`, `alamat`, `poster`, `bukti_bayar`, `status`, `created_by`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            param: [ids_cabang, nama_acara, slug_event, proposal, tgl_awal_acara, tgl_akhir_acara, ids_kelurahan, rw, rt, alamat, poster, bukti_bayar, status, req.authIdUser]
        });

        json = {
            id_event: result.insertId,
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
        const created_by = (req.authTingkat <= 5) ? req.query.created_by : null;
        const tgl_awal_acara = helper.convertoDate(req.query.tgl_awal_acara);
        const tgl_akhir_acara = helper.convertoDate(req.query.tgl_akhir_acara);
        const order_by = req.query.order_by || 'created_at DESC';
        const {
            id_event,
            ids_cabang,
            cabang,
            nama_acara,
            slug_event,
            ids_provinsi,
            provinsi,
            pulau,
            ids_kabkota,
            kabkota,
            ids_kecamatan,
            kecamatan,
            ids_kelurahan,
            kelurahan,
            status,
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
        let sqlRead = "SELECT * FROM `view_event`";
        let sqlReadTotalData = "SELECT COUNT(id_event) as total FROM `view_event`";
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

        addCondition('id_event', id_event, 'IN');
        addCondition('ids_cabang', ids_cabang, 'IN');
        addCondition('cabang', cabang, 'LIKE');
        addCondition('nama_acara', nama_acara, 'LIKE');
        addCondition('slug_event', slug_event);
        addCondition('tgl_awal_acara', tgl_awal_acara);
        addCondition('tgl_akhir_acara', tgl_akhir_acara);
        addCondition('ids_provinsi', ids_provinsi, 'IN');
        addCondition('provinsi', provinsi, 'LIKE');
        addCondition('pulau', pulau);
        addCondition('ids_kabkota', ids_kabkota, 'IN');
        addCondition('kabkota', kabkota, 'LIKE');
        addCondition('ids_kecamatan', ids_kecamatan, 'IN');
        addCondition('kecamatan', kecamatan, 'LIKE');
        addCondition('ids_kelurahan', ids_kelurahan, 'IN');
        addCondition('kelurahan', kelurahan, 'LIKE');
        addCondition('status', status);
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

        getData.forEach(item => {
            item.tgl_awal_acara = helper.convertoDate(item.tgl_awal_acara);
            item.tgl_akhir_acara = helper.convertoDate(item.tgl_akhir_acara);
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
}

Controller.update = async (req, res) => {
    try {
        const hasAccess = await checkAccess(req, 'update');
        if (!hasAccess) {
            return response.sc401("Access denied.", {}, res);
        }

        const id = req.params.id;
        const {
            ids_cabang,
            nama_acara,
            slug_event,
            proposal,
            tgl_awal_acara,
            tgl_akhir_acara,
            ids_kelurahan,
            rw,
            rt,
            alamat,
            poster,
            bukti_bayar,
            status,
        } = req.body;

        /* Check existing data */
        let sql = 'SELECT id_event FROM `tbl_event` WHERE id_event = ? LIMIT 1';
        const param = [id];
        if (req.authIdsLevel >= 4) {
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

        /* Check existing slug */
        if (!isEmpty(slug_event)) {
            let checkSlug = await helper.runSQL({
                sql: 'SELECT ids_cabang FROM `tbl_event` WHERE slug_event = ? AND id_event != ? LIMIT 1',
                param: [slug_event, id],
            });
            if (checkSlug.length) {
                return response.sc400('Slug already exists.', {}, res);
            }
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

        addUpdate('ids_cabang', ids_cabang);
        addUpdate('nama_acara', nama_acara);
        addUpdate('slug_event', slug_event);
        addUpdate('proposal', proposal);
        addUpdate('tgl_awal_acara', tgl_awal_acara);
        addUpdate('tgl_akhir_acara', tgl_akhir_acara);
        addUpdate('ids_kelurahan', ids_kelurahan);
        addUpdate('rw', rw);
        addUpdate('rt', rt);
        addUpdate('alamat', alamat);
        addUpdate('poster', poster);
        addUpdate('bukti_bayar', bukti_bayar);
        addUpdate('status', status);

        // Check Data Update
        if (isEmpty(params)) {
            return response.sc400("No data has been changed.", {}, res);
        }

        addUpdate('updated_by', req.authIdUser);
        await helper.runSQL({
            sql: `UPDATE tbl_event SET ${updates.join(', ')} WHERE id_event = ?`,
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
        let sql = 'SELECT id_event FROM `tbl_event` WHERE id_event = ? LIMIT 1';
        const param = [id];
        if (req.authIdsLevel >= 4) {
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
            sql: 'DELETE FROM `tbl_event` WHERE id_event = ?',
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
        const created_by = (req.authTingkat <= 5) ? req.query.created_by : null;
        const {
            id_event,
            ids_cabang,
            cabang,
            nama_acara,
            slug_event,
            tgl_awal_acara,
            tgl_akhir_acara,
            ids_provinsi,
            provinsi,
            pulau,
            ids_kabkota,
            kabkota,
            ids_kecamatan,
            kecamatan,
            ids_kelurahan,
            kelurahan,
            status,
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
        let sqlSingle = "SELECT * FROM `view_event`";
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

        addCondition('id_event', id_event);
        addCondition('ids_cabang', ids_cabang);
        addCondition('cabang', cabang, 'LIKE');
        addCondition('nama_acara', nama_acara, 'LIKE');
        addCondition('slug_event', slug_event);
        addCondition('tgl_awal_acara', tgl_awal_acara);
        addCondition('tgl_akhir_acara', tgl_akhir_acara);
        addCondition('ids_provinsi', ids_provinsi);
        addCondition('provinsi', provinsi, 'LIKE');
        addCondition('pulau', pulau);
        addCondition('ids_kabkota', ids_kabkota);
        addCondition('kabkota', kabkota, 'LIKE');
        addCondition('ids_kecamatan', ids_kecamatan);
        addCondition('kecamatan', kecamatan, 'LIKE');
        addCondition('ids_kelurahan', ids_kelurahan);
        addCondition('kelurahan', kelurahan, 'LIKE');
        addCondition('status', status);
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

        getData[0].tgl_awal_acara = helper.convertoDate(getData[0].tgl_awal_acara);
        getData[0].tgl_akhir_acara = helper.convertoDate(getData[0].tgl_akhir_acara);

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