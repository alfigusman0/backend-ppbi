/* Config */
const redis = require('../../config/redis');

/* Libraries */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

/* Helpers */
const notification = require('../../helpers/notification');
const whatsapp = require('../../helpers/whatsapp');
const response = require('../../helpers/response');
const isEmpty = require('../../validation/is-empty');
const helper = require('../../helpers/helper');

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

/**
 * Endpoint untuk membuat notifikasi + opsi kirim WhatsApp
 * POST /api/notification/create
 */
Controller.create = async (req, res) => {
    try {
        const {
            id_user,
            judul,
            isi,
            id_event,
            send_whatsapp_now,
            created_by
        } = req.body;

        if (isEmpty(id_user)) {
            return response.sc400('Parameter id_user wajib diisi', {}, res);
        }

        if (isEmpty(judul)) {
            return response.sc400('Parameter judul wajib diisi', {}, res);
        }

        if (isEmpty(isi)) {
            return response.sc400('Parameter isi wajib diisi', {}, res);
        }

        if (isEmpty(created_by)) {
            return response.sc400('Parameter created_by wajib diisi', {}, res);
        }

        let whatsappStatus = 'TIDAK';

        if (send_whatsapp_now === true && id_event) {
            whatsappStatus = 'YA';
        }

        logger.info('Membuat notifikasi baru', {
            id_user,
            send_whatsapp_now,
            whatsappStatus,
            created_by
        });

        const createResult = await notification.create({
            id_user,
            judul,
            isi,
            whatsapp: whatsappStatus,
            created_by
        });

        if (!createResult.success) {
            return response.sc500(createResult.message, createResult.error, res);
        }

        const id_notif = createResult.id_notif;
        let whatsappResult = null;

        if (send_whatsapp_now === true && id_event) {
            try {
                const userSql = {
                    sql: `SELECT nmr_tlpn, nama_lengkap FROM view_profile 
                          WHERE created_by = ? AND nmr_tlpn IS NOT NULL LIMIT 1`,
                    param: [id_user]
                };

                const userData = await helper.runSQL(userSql);

                if (userData && userData.length > 0) {
                    const userPhone = userData[0].nmr_tlpn;
                    const userName = userData[0].nama_lengkap;

                    const target = whatsapp.formatTargetWithVariable(userPhone, userName);

                    whatsappResult = await whatsapp.sendMessage(id_event, {
                        target,
                        message: `${judul}\n\n${isi}`,
                        typing: true
                    });

                    const newWhatsappStatus = whatsappResult.success ? 'YA' : 'ERROR';
                    await notification.updateWhatsappStatus(id_notif, newWhatsappStatus, created_by);

                    logger.info('WhatsApp berhasil dikirim langsung', {
                        id_notif,
                        status: newWhatsappStatus
                    });
                } else {
                    logger.warn('User tidak punya nomor telepon', { id_user });
                    whatsappResult = {
                        success: false,
                        message: 'User tidak memiliki nomor telepon yang valid'
                    };
                }

            } catch (whatsappError) {
                logger.error('Error saat mengirim WhatsApp langsung', {
                    id_notif,
                    error: whatsappError.message
                });

                await notification.updateWhatsappStatus(id_notif, 'ERROR', created_by);

                whatsappResult = {
                    success: false,
                    message: whatsappError.message
                };
            }
        }

        const responseData = {
            id_notif,
            judul,
            isi,
            whatsapp_status: whatsappStatus,
            whatsapp_result: whatsappResult
        };

        const statusMsg = send_whatsapp_now ? 
            'Notifikasi berhasil dibuat dan WhatsApp dikirim' : 
            'Notifikasi berhasil dibuat (akan dikirim WhatsApp via cron job)';

        return response.sc200(statusMsg, responseData, res);

    } catch (error) {
        logger.error('Error di controller create notification', { error: error.message });
        return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
    }
};

/**
 * Endpoint untuk membuat bulk notifikasi ke multiple user
 * POST /api/notification/create-bulk
 */
Controller.createBulk = async (req, res) => {
    try {
        const {
            user_ids,
            judul,
            isi,
            id_event,
            send_whatsapp_now,
            created_by
        } = req.body;

        if (!Array.isArray(user_ids) || user_ids.length === 0) {
            return response.sc400('Parameter user_ids harus berupa array dan tidak boleh kosong', {}, res);
        }

        if (isEmpty(judul)) {
            return response.sc400('Parameter judul wajib diisi', {}, res);
        }

        if (isEmpty(isi)) {
            return response.sc400('Parameter isi wajib diisi', {}, res);
        }

        if (isEmpty(created_by)) {
            return response.sc400('Parameter created_by wajib diisi', {}, res);
        }

        logger.info('Membuat bulk notifikasi', {
            userCount: user_ids.length,
            send_whatsapp_now,
            created_by
        });

        let successCount = 0;
        let failedCount = 0;
        const createdNotifications = [];

        for (const userId of user_ids) {
            try {
                const createResult = await notification.create({
                    id_user: userId,
                    judul,
                    isi,
                    whatsapp: send_whatsapp_now ? 'YA' : 'TIDAK',
                    created_by
                });

                if (createResult.success) {
                    successCount++;
                    createdNotifications.push({
                        id_notif: createResult.id_notif,
                        id_user: userId,
                        status: 'berhasil'
                    });
                } else {
                    failedCount++;
                    logger.error('Gagal create notifikasi untuk user', { userId });
                }

            } catch (error) {
                failedCount++;
                logger.error('Error saat create notifikasi untuk user', { userId, error: error.message });
            }
        }

        logger.info('Bulk notifikasi selesai dibuat', {
            successCount,
            failedCount,
            total: user_ids.length
        });

        if (send_whatsapp_now === true && id_event && successCount > 0) {
            setImmediate(() => {
                Controller._sendWhatsappForNotifications(createdNotifications, id_event, created_by);
            });
        }

        return response.sc200('Bulk notifikasi berhasil dibuat', {
            total: user_ids.length,
            success: successCount,
            failed: failedCount,
            notifications: createdNotifications,
            whatsapp_queued: send_whatsapp_now
        }, res);

    } catch (error) {
        logger.error('Error di controller createBulk notification', { error: error.message });
        return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
    }
};

/**
 * Background process untuk mengirim WhatsApp ke notifikasi
 * @private
 */
Controller._sendWhatsappForNotifications = async (notifications, idEvent, createdBy) => {
    try {
        logger.info('Background process: mengirim WhatsApp untuk bulk notifikasi', {
            count: notifications.length
        });

        for (const notif of notifications) {
            try {
                const notifDetail = await notification.getById(notif.id_notif);

                if (!notifDetail) {
                    logger.warn('Notifikasi tidak ditemukan', { id_notif: notif.id_notif });
                    continue;
                }

                const userSql = {
                    sql: `SELECT nmr_tlpn, nama_lengkap FROM view_profile 
                          WHERE created_by = ? AND nmr_tlpn IS NOT NULL LIMIT 1`,
                    param: [notifDetail.id_user]
                };

                const userData = await helper.runSQL(userSql);

                if (!userData || userData.length === 0) {
                    logger.warn('User tidak punya nomor telepon', { id_user: notifDetail.id_user });
                    await notification.updateWhatsappStatus(notif.id_notif, 'ERROR', createdBy);
                    continue;
                }

                const userPhone = userData[0].nmr_tlpn;
                const userName = userData[0].nama_lengkap;
                const target = whatsapp.formatTargetWithVariable(userPhone, userName);

                const whatsappResult = await whatsapp.sendMessage(idEvent, {
                    target,
                    message: `${notifDetail.judul}\n\n${notifDetail.isi}`,
                    typing: true,
                    delay: '2'
                });

                const status = whatsappResult.success ? 'YA' : 'ERROR';
                await notification.updateWhatsappStatus(notif.id_notif, status, createdBy);

                logger.info('WhatsApp notifikasi dikirim', {
                    id_notif: notif.id_notif,
                    id_user: notifDetail.id_user,
                    status
                });

            } catch (error) {
                logger.error('Error mengirim WhatsApp untuk notifikasi', {
                    id_notif: notif.id_notif,
                    error: error.message
                });

                await notification.updateWhatsappStatus(notif.id_notif, 'ERROR', createdBy);
            }
        }

        logger.info('Background process selesai untuk bulk notifikasi WhatsApp');

    } catch (error) {
        logger.error('Error di background process WhatsApp notifikasi', { error: error.message });
    }
};

/**
 * Endpoint untuk mengambil notifikasi user (in-app notification)
 * GET /api/notification/user/:page/:limit
 */
Controller.getUserNotifications = async (req, res) => {
    try {
        const userId = req.user?.id_user;
        const page = parseInt(req.params.page) || 1;
        const limit = parseInt(req.params.limit) || 20;

        if (!userId) {
            return response.sc401('Unauthorized', {}, res);
        }

        const result = await notification.getByUserId(userId, page, limit);

        return response.sc200('Notifikasi user berhasil diambil', result, res);

    } catch (error) {
        logger.error('Error di controller getUserNotifications', { error: error.message });
        return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
    }
};

/**
 * Endpoint untuk mark notifikasi as read
 * PUT /api/notification/:id/read
 */
Controller.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return response.sc400('ID Notifikasi tidak ditemukan', {}, res);
        }

        const result = await notification.markAsRead(id);

        if (!result.success) {
            return response.sc404(result.message, result.error, res);
        }

        return response.sc200(result.message, {}, res);

    } catch (error) {
        logger.error('Error di controller markAsRead', { error: error.message });
        return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
    }
};

/**
 * Endpoint untuk bulk mark as read
 * PUT /api/notification/bulk-read
 */
Controller.markMultipleAsRead = async (req, res) => {
    try {
        const { notif_ids } = req.body;

        if (!Array.isArray(notif_ids) || notif_ids.length === 0) {
            return response.sc400('Parameter notif_ids harus berupa array', {}, res);
        }

        const result = await notification.markMultipleAsRead(notif_ids);

        if (!result.success) {
            return response.sc500(result.message, result.error, res);
        }

        return response.sc200(result.message, { affected_rows: result.affectedRows }, res);

    } catch (error) {
        logger.error('Error di controller markMultipleAsRead', { error: error.message });
        return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
    }
};

module.exports = Controller;