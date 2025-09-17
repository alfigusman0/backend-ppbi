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

const redisPrefix = process.env.REDIS_PREFIX + "daftar:kelulusan:";

// Helper function to check access rights
const checkAccess = async (req, action) => {
    const sql = {
        sql: "SELECT * FROM tbs_hak_akses WHERE ids_level = ? AND ids_modul = ? AND permission LIKE ?",
        param: [req.authIdsLevel, 23, `%${action}%`]
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

        const id_user = (req.authIdsLevel === '5') ? req.authIdUser : req.query.id_user;
        const {
            nomor_peserta,
            nim,
            nama,
            kode_jurusan,
            ids_konsentrasi,
            ids_jalur_masuk,
            ids_tipe_ujian,
            tahun,
            daftar,
            tgl_daftar,
            submit,
            tgl_submit,
            pembayaran,
            tgl_pembayaran,
            ket_pembayaran,
            pemberkasan,
            tgl_pemberkasan,
            kelas,
        } = req.body;

        /* Check existing data */
        let checkData = await helper.runSQL({
            sql: 'SELECT idd_kelulusan FROM `tbd_kelulusan` WHERE idd_kelulusan = ? LIMIT 1',
            param: [idd_kelulusan],
        });
        if (checkData.length) {
            message = 'Data already exists.';
            return response.sc400(message, json, res);
        }

        /* SQL Insert Data */
        const result = await helper.runSQL({
            sql: "INSERT INTO `tbd_kelulusan` (id_user, nomor_peserta, nim, nama, kode_jurusan, ids_konsentrasi, ids_jalur_masuk, ids_tipe_ujian, tahun, daftar, tgl_daftar, submit, tgl_submit, pembayaran, tgl_pembayaran, ket_pembayaran, pemberkasan, tgl_pemberkasan, kelas, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            param: [id_user, nomor_peserta, nim, nama, kode_jurusan, ids_konsentrasi, ids_jalur_masuk, ids_tipe_ujian, tahun, daftar, tgl_daftar, , submit, tgl_submit, pembayaran, tgl_pembayaran, ket_pembayaran, pemberkasan, tgl_pemberkasan, kelas, req.authIdUser]
        });

        json = {
            idd_kelulusan: result.insertId,
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

        const id_user = (req.authIdsLevel == '5') ? req.authIdUser : req.query.id_user;
        console.log('id_user:', id_user, 'req.authIdsLevel:', req.authIdsLevel);
        console.log((req.authIdsLevel == '5'));
        const order_by = req.query.order_by || 'date_created DESC';
        const key = redisPrefix + "read:" + md5(req.authToken + req.originalUrl);
        const {
            idd_kelulusan,
            nomor_peserta,
            nim,
            nama,
            ids_fakultas,
            fakultas,
            kode_jurusan,
            jurusan,
            jenjang,
            ids_konsentrasi,
            konsentrasi,
            ids_jalur_masuk,
            jalur_masuk,
            alias_jalur_masuk,
            ids_program,
            program,
            kelas_program,
            ids_tipe_ujian,
            tipe_ujian,
            tahun,
            daftar,
            submit,
            pembayaran,
            pemberkasan,
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
        let sqlRead = "SELECT * FROM `viewd_kelulusan`";
        let sqlReadTotalData = "SELECT COUNT(idd_kelulusan) as total FROM `viewd_kelulusan`";
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

        addCondition('idd_kelulusan', idd_kelulusan);
        addCondition('id_user', id_user);
        addCondition('nomor_peserta', nomor_peserta);
        addCondition('nim', nim, 'LIKE');
        addCondition('nama', nama, 'LIKE');
        addCondition('ids_fakultas', ids_fakultas, 'IN');
        addCondition('fakultas', fakultas, 'LIKE');
        addCondition('kode_jurusan', kode_jurusan, 'IN');
        addCondition('jurusan', jurusan);
        addCondition('jenjang', jenjang, 'IN');
        addCondition('ids_konsentrasi', ids_konsentrasi, 'IN');
        addCondition('konsentrasi', konsentrasi);
        addCondition('ids_jalur_masuk', ids_jalur_masuk, 'IN');
        addCondition('jalur_masuk', jalur_masuk);
        addCondition('alias_jalur_masuk', alias_jalur_masuk);
        addCondition('ids_program', ids_program, 'IN');
        addCondition('program', program);
        addCondition('kelas_program', kelas_program);
        addCondition('ids_tipe_ujian', ids_tipe_ujian, 'IN');
        addCondition('tipe_ujian', tipe_ujian);
        addCondition('tahun', tahun);
        addCondition('daftar', daftar);
        addCondition('submit', submit);
        addCondition('pembayaran', pembayaran);
        addCondition('pemberkasan', pemberkasan);

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
            item.tgl_daftar = helper.convertoDateTime(item.tgl_daftar);
            item.tgl_submit = helper.convertoDateTime(item.tgl_submit);
            item.tgl_pembayaran = helper.convertoDateTime(item.tgl_pembayaran);
            item.tgl_pemberkasan = helper.convertoDateTime(item.tgl_pemberkasan);
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
        const id_user = (req.authIdsLevel === '5') ? req.authIdUser : req.query.id_user;
        const pembayaran = (req.authIdsLevel !== '5') ? req.body.pembayaran : null;
        const tgl_pembayaran = (req.authIdsLevel !== '5') ? req.body.tgl_pembayaran : null;
        const ket_pembayaran = (req.authIdsLevel !== '5') ? req.body.ket_pembayaran : null;
        const {
            nomor_peserta,
            nim,
            nama,
            kode_jurusan,
            ids_konsentrasi,
            ids_jalur_masuk,
            ids_tipe_ujian,
            tahun,
            daftar,
            tgl_daftar,
            submit,
            tgl_submit,
            pemberkasan,
            tgl_pemberkasan,
            kelas,
        } = req.body;


        /* Check existing data */
        let sql = 'SELECT idd_kelulusan FROM `tbd_kelulusan` WHERE idd_kelulusan = ?';
        const param = [id];
        if (req.authIdsLevel == "5") {
            sql += ' AND id_user = ?';
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

        addUpdate('nomor_peserta', nomor_peserta);
        addUpdate('id_user', id_user);
        addUpdate('nim', nim);
        addUpdate('nama', nama);
        addUpdate('kode_jurusan', kode_jurusan);
        addUpdate('ids_konsentrasi', ids_konsentrasi);
        addUpdate('ids_jalur_masuk', ids_jalur_masuk);
        addUpdate('ids_tipe_ujian', ids_tipe_ujian);
        addUpdate('tahun', tahun);
        addUpdate('daftar', daftar);
        addUpdate('tgl_daftar', tgl_daftar);
        addUpdate('submit', submit);
        addUpdate('tgl_submit', tgl_submit);
        addUpdate('pembayaran', pembayaran);
        addUpdate('tgl_pembayaran', tgl_pembayaran);
        addUpdate('ket_pembayaran', ket_pembayaran);
        addUpdate('pemberkasan', pemberkasan);
        addUpdate('tgl_pemberkasan', tgl_pemberkasan);
        addUpdate('kelas', kelas);

        // Check Data Update
        if (isEmpty(params)) {
            return response.sc400("No data has been changed.", {}, res);
        }

        /* addUpdate('updated_by', req.authIdUser); */
        await helper.runSQL({
            sql: `UPDATE tbd_kelulusan SET ${updates.join(', ')} WHERE idd_kelulusan = ?`,
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
        let sql = 'SELECT idd_kelulusan FROM `tbd_kelulusan` WHERE idd_kelulusan = ?';
        const param = [id];
        if (req.authIdsLevel == "5") {
            sql += ' AND id_user = ?';
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
            sql: 'DELETE FROM `tbd_kelulusan` WHERE idd_kelulusan = ?',
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

        const id_user = (req.authIdsLevel === '5') ? req.authIdUser : req.query.id_user;
        const key = redisPrefix + "single:" + md5(req.authToken + req.originalUrl);
        const {
            idd_kelulusan,
            nomor_peserta,
            nim,
            nama,
            ids_fakultas,
            fakultas,
            kode_jurusan,
            jurusan,
            jenjang,
            ids_konsentrasi,
            konsentrasi,
            ids_jalur_masuk,
            jalur_masuk,
            alias_jalur_masuk,
            ids_program,
            program,
            kelas_program,
            ids_tipe_ujian,
            tipe_ujian,
            tahun,
            daftar,
            submit,
            pembayaran,
            pemberkasan,
            check,
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
        let sqlSingle = "SELECT * FROM `viewd_kelulusan`";
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

        addCondition('idd_kelulusan', idd_kelulusan);
        addCondition('nomor_peserta', nomor_peserta);
        addCondition('nim', nim, 'LIKE');
        addCondition('nama', nama, 'LIKE');
        addCondition('ids_fakultas', ids_fakultas);
        addCondition('fakultas', fakultas, 'LIKE');
        addCondition('kode_jurusan', kode_jurusan);
        addCondition('jurusan', jurusan);
        addCondition('jenjang', jenjang, 'LIKE');
        addCondition('ids_konsentrasi', ids_konsentrasi);
        addCondition('konsentrasi', konsentrasi);
        addCondition('ids_jalur_masuk', ids_jalur_masuk);
        addCondition('jalur_masuk', jalur_masuk);
        addCondition('alias_jalur_masuk', alias_jalur_masuk);
        addCondition('ids_program', ids_program);
        addCondition('program', program);
        addCondition('kelas_program', kelas_program);
        addCondition('ids_tipe_ujian', ids_tipe_ujian);
        addCondition('tipe_ujian', tipe_ujian);
        addCondition('tahun', tahun);
        addCondition('daftar', daftar);
        addCondition('submit', submit);
        addCondition('pembayaran', pembayaran);
        addCondition('pemberkasan', pemberkasan);

        if (check !== "on") {
            addCondition('id_user', id_user);
        }

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

        getData[0].tgl_daftar = helper.convertoDateTime(getData[0].tgl_daftar);
        getData[0].tgl_submit = helper.convertoDateTime(getData[0].tgl_submit);
        getData[0].tgl_pembayaran = helper.convertoDateTime(getData[0].tgl_pembayaran);
        getData[0].tgl_pemberkasan = helper.convertoDateTime(getData[0].tgl_pemberkasan);

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