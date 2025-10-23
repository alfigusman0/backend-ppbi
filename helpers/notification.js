/* Config */
const database = require('../config/database');

/* Libraries */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

/* Helpers */
const helper = require('./helper');

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
            filename: "./logs/notification-%DATE%.log",
            zippedArchive: true,
            maxSize: "100m",
            maxFiles: "14d"
        }),
    ]
});

const notification = {};

/**
 * Insert notifikasi ke tbl_notif
 * @param {Object} params - Parameter notifikasi
 * @returns {Promise<Object>}
 */
notification.create = async (params) => {
    try {
        const required = ['id_user', 'judul', 'isi', 'created_by'];
        for (const field of required) {
            if (!params[field]) {
                throw new Error(`Parameter ${field} wajib diisi`);
            }
        }

        const validWhatsappStatus = ['TIDAK', 'YA', 'ERROR'];
        const whatsappStatus = params.whatsapp || 'TIDAK';
        if (!validWhatsappStatus.includes(whatsappStatus)) {
            throw new Error('Status WhatsApp harus TIDAK, YA, atau ERROR');
        }

        const insertData = {
            id_user: params.id_user,
            judul: params.judul.substring(0, 255),
            isi: params.isi,
            whatsapp: whatsappStatus,
            dibaca: params.dibaca ? 'YA' : 'TIDAK',
            created_by: params.created_by
        };

        logger.info('Membuat notifikasi baru', {
            id_user: params.id_user,
            whatsapp: whatsappStatus,
            created_by: params.created_by
        });

        const sql = {
            sql: `INSERT INTO tbl_notif 
                  (id_user, judul, isi, dibaca, whatsapp, created_by) 
                  VALUES (?, ?, ?, ?, ?, ?)`,
            param: [
                insertData.id_user,
                insertData.judul,
                insertData.isi,
                insertData.dibaca,
                insertData.whatsapp,
                insertData.created_by
            ]
        };

        const result = await helper.runSQL(sql);

        if (!result || !result.insertId) {
            throw new Error('Gagal membuat notifikasi di database');
        }

        logger.info('Notifikasi berhasil dibuat', {
            id_notif: result.insertId,
            id_user: params.id_user
        });

        return {
            success: true,
            message: 'Notifikasi berhasil dibuat',
            id_notif: result.insertId,
            data: insertData,
            error: null
        };

    } catch (error) {
        logger.error('Error membuat notifikasi', {
            error: error.message,
            params: {
                id_user: params.id_user,
                created_by: params.created_by
            }
        });

        return {
            success: false,
            message: error.message,
            id_notif: null,
            data: null,
            error: { message: error.message }
        };
    }
};

/**
 * Update status WhatsApp di tbl_notif
 * @param {number} idNotif - ID Notifikasi
 * @param {string} status - Status WhatsApp: 'YA', 'ERROR'
 * @param {number} updatedBy - ID User yang update
 * @returns {Promise<Object>}
 */
notification.updateWhatsappStatus = async (idNotif, status, updatedBy = null) => {
    try {
        if (!idNotif || idNotif <= 0) {
            throw new Error('ID Notifikasi tidak valid');
        }

        const validStatus = ['YA', 'ERROR'];
        if (!validStatus.includes(status)) {
            throw new Error('Status WhatsApp harus YA atau ERROR');
        }

        logger.info('Update status WhatsApp notifikasi', {
            idNotif,
            status
        });

        let sql;
        if (updatedBy) {
            sql = {
                sql: `UPDATE tbl_notif 
                      SET whatsapp = ?, updated_by = ?, updated_at = NOW() 
                      WHERE id_notif = ?`,
                param: [status, updatedBy, idNotif]
            };
        } else {
            sql = {
                sql: `UPDATE tbl_notif 
                      SET whatsapp = ?, updated_at = NOW() 
                      WHERE id_notif = ?`,
                param: [status, idNotif]
            };
        }

        const result = await helper.runSQL(sql);

        if (!result || result.affectedRows === 0) {
            logger.warn('Notifikasi tidak ditemukan untuk update', { idNotif });
            return {
                success: false,
                message: 'Notifikasi tidak ditemukan',
                error: { message: 'Notifikasi tidak ditemukan' }
            };
        }

        logger.info('Status WhatsApp notifikasi berhasil diupdate', {
            idNotif,
            status,
            affectedRows: result.affectedRows
        });

        return {
            success: true,
            message: 'Status WhatsApp notifikasi berhasil diupdate',
            error: null
        };

    } catch (error) {
        logger.error('Error update WhatsApp status notifikasi', {
            idNotif,
            status,
            error: error.message
        });

        return {
            success: false,
            message: error.message,
            error: { message: error.message }
        };
    }
};

/**
 * Ambil list notifikasi yang belum dikirim WhatsApp
 * @param {number} limit - Jumlah record
 * @returns {Promise<Array>}
 */
notification.getPendingWhatsapp = async (limit = 100) => {
    try {
        if (limit <= 0 || limit > 1000) {
            limit = 100;
        }

        logger.info('Mengambil notifikasi pending WhatsApp', { limit });

        const sql = {
            sql: `SELECT 
                    n.id_notif,
                    n.id_user,
                    n.judul,
                    n.isi,
                    n.whatsapp,
                    n.created_by,
                    n.created_at,
                    vp.nmr_tlpn,
                    vp.nama_lengkap,
                    vp.username
                FROM tbl_notif n
                LEFT JOIN view_profile vp ON vp.created_by = n.id_user
                WHERE n.whatsapp = 'TIDAK' 
                AND vp.nmr_tlpn IS NOT NULL 
                AND vp.nmr_tlpn != ''
                ORDER BY n.created_at ASC
                LIMIT ?`,
            param: [limit]
        };

        const result = await helper.runSQL(sql);

        logger.info('Notifikasi pending WhatsApp berhasil diambil', {
            count: result ? result.length : 0
        });

        return result || [];

    } catch (error) {
        logger.error('Error mengambil notifikasi pending WhatsApp', {
            error: error.message
        });
        return [];
    }
};

/**
 * Ambil detail notifikasi berdasarkan id_notif
 * @param {number} idNotif - ID Notifikasi
 * @returns {Promise<Object>}
 */
notification.getById = async (idNotif) => {
    try {
        if (!idNotif || idNotif <= 0) {
            throw new Error('ID Notifikasi tidak valid');
        }

        const sql = {
            sql: `SELECT 
                    n.*,
                    vp.nmr_tlpn,
                    vp.nama_lengkap,
                    vp.username,
                    u.username as created_by_user
                FROM tbl_notif n
                LEFT JOIN view_profile vp ON vp.created_by = n.id_user
                LEFT JOIN tbl_users u ON u.id_user = n.created_by
                WHERE n.id_notif = ?`,
            param: [idNotif]
        };

        const result = await helper.runSQL(sql);

        if (!result || result.length === 0) {
            return null;
        }

        return result[0];

    } catch (error) {
        logger.error('Error mengambil notifikasi detail', {
            idNotif,
            error: error.message
        });
        return null;
    }
};

/**
 * Ambil list notifikasi berdasarkan id_user (dengan pagination)
 * @param {number} idUser - ID User
 * @param {number} page - Halaman
 * @param {number} limit - Jumlah per halaman
 * @returns {Promise<Object>}
 */
notification.getByUserId = async (idUser, page = 1, limit = 20) => {
    try {
        if (!idUser || idUser <= 0) {
            throw new Error('ID User tidak valid');
        }

        const offset = (page - 1) * limit;

        const countSql = {
            sql: "SELECT COUNT(*) as total FROM tbl_notif WHERE id_user = ?",
            param: [idUser]
        };

        const countResult = await helper.runSQL(countSql);
        const total = countResult[0]?.total || 0;

        const dataSql = {
            sql: `SELECT * FROM tbl_notif 
                  WHERE id_user = ? 
                  ORDER BY created_at DESC 
                  LIMIT ? OFFSET ?`,
            param: [idUser, limit, offset]
        };

        const data = await helper.runSQL(dataSql);

        const pages = Math.ceil(total / limit);

        return {
            data: data || [],
            total,
            page,
            limit,
            pages,
            hasNext: page < pages,
            hasPrev: page > 1
        };

    } catch (error) {
        logger.error('Error mengambil notifikasi by user', {
            idUser,
            error: error.message
        });

        return {
            data: [],
            total: 0,
            page: page,
            limit: limit,
            pages: 0,
            hasNext: false,
            hasPrev: false
        };
    }
};

/**
 * Update status dibaca notifikasi
 * @param {number} idNotif - ID Notifikasi
 * @returns {Promise<Object>}
 */
notification.markAsRead = async (idNotif) => {
    try {
        if (!idNotif || idNotif <= 0) {
            throw new Error('ID Notifikasi tidak valid');
        }

        const sql = {
            sql: `UPDATE tbl_notif 
                  SET dibaca = 'YA', updated_at = NOW() 
                  WHERE id_notif = ?`,
            param: [idNotif]
        };

        const result = await helper.runSQL(sql);

        if (!result || result.affectedRows === 0) {
            return {
                success: false,
                message: 'Notifikasi tidak ditemukan',
                error: { message: 'Notifikasi tidak ditemukan' }
            };
        }

        return {
            success: true,
            message: 'Notifikasi berhasil ditandai dibaca',
            error: null
        };

    } catch (error) {
        logger.error('Error mark as read notifikasi', {
            idNotif,
            error: error.message
        });

        return {
            success: false,
            message: error.message,
            error: { message: error.message }
        };
    }
};

/**
 * Bulk mark as read
 * @param {Array} notifIds - Array of id_notif
 * @returns {Promise<Object>}
 */
notification.markMultipleAsRead = async (notifIds) => {
    try {
        if (!Array.isArray(notifIds) || notifIds.length === 0) {
            throw new Error('Parameter notifIds harus berupa array dan tidak boleh kosong');
        }

        const placeholders = notifIds.map(() => '?').join(',');

        const sql = {
            sql: `UPDATE tbl_notif 
                  SET dibaca = 'YA', updated_at = NOW() 
                  WHERE id_notif IN (${placeholders})`,
            param: notifIds
        };

        const result = await helper.runSQL(sql);

        return {
            success: true,
            message: `${result.affectedRows} notifikasi berhasil ditandai dibaca`,
            affectedRows: result.affectedRows,
            error: null
        };

    } catch (error) {
        logger.error('Error bulk mark as read', {
            count: notifIds?.length,
            error: error.message
        });

        return {
            success: false,
            message: error.message,
            affectedRows: 0,
            error: { message: error.message }
        };
    }
};

module.exports = notification;