/* Config */

/* Libraries */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

/* Helpers */
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
 * Endpoint untuk mengirim pesan WhatsApp tunggal
 * POST /api/notification/whatsapp/send
 * Body: {id_event, target, message, ...}
 */
Controller.send = async (req, res) => {
    try {
        const {
            id_event,
            target,
            message,
            url,
            filename,
            schedule,
            delay,
            countryCode,
            location,
            typing,
            connectOnly,
            preview
        } = req.body;

        if (isEmpty(id_event)) {
            return response.sc400('Parameter id_event wajib diisi', {}, res);
        }

        if (isEmpty(target)) {
            return response.sc400('Parameter target wajib diisi', {}, res);
        }

        const result = await whatsapp.sendMessage(id_event, {
            target,
            message,
            url,
            filename,
            schedule,
            delay,
            countryCode,
            location,
            typing,
            connectOnly,
            preview
        });

        if (!result.success) {
            const statusCode = result.errorType === 'TOKEN_ERROR' ? 401 : 500;
            return response[`sc${statusCode}`](result.message, result.error || {}, res);
        }

        return response.sc200('Pesan WhatsApp berhasil dikirim', result.data, res);

    } catch (error) {
        logger.error('Error di controller send WhatsApp', {
            error: error.message
        });
        return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
    }
};

/**
 * Endpoint untuk mengirim pesan WhatsApp ke multiple target dengan custom message
 * POST /api/notification/whatsapp/send-bulk
 * Body: {id_event, messages: [...]}
 */
Controller.sendBulk = async (req, res) => {
    try {
        const {
            id_event,
            messages
        } = req.body;

        if (isEmpty(id_event)) {
            return response.sc400('Parameter id_event wajib diisi', {}, res);
        }

        if (!Array.isArray(messages) || messages.length === 0) {
            return response.sc400('Parameter messages harus berupa array dan tidak boleh kosong', {}, res);
        }

        const result = await whatsapp.sendBulkMessages(id_event, messages);

        if (!result.success) {
            const statusCode = result.errorType === 'TOKEN_ERROR' ? 401 : 500;
            return response[`sc${statusCode}`](result.message, result.error || {}, res);
        }

        return response.sc200('Bulk pesan WhatsApp berhasil dikirim', result.data, res);

    } catch (error) {
        logger.error('Error di controller sendBulk WhatsApp', {
            error: error.message
        });
        return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
    }
};

/**
 * Endpoint untuk mengirim polling WhatsApp
 * POST /api/notification/whatsapp/send-poll
 */
Controller.sendPoll = async (req, res) => {
    try {
        const {
            id_event,
            target,
            message,
            choices,
            select,
            pollname
        } = req.body;

        if (isEmpty(id_event)) {
            return response.sc400('Parameter id_event wajib diisi', {}, res);
        }

        if (isEmpty(target)) {
            return response.sc400('Parameter target wajib diisi', {}, res);
        }

        if (isEmpty(choices)) {
            return response.sc400('Parameter choices wajib diisi untuk polling', {}, res);
        }

        const choicesArray = choices.split(',');
        if (choicesArray.length < 2 || choicesArray.length > 12) {
            return response.sc400('Choices harus antara 2-12 pilihan', {}, res);
        }

        const result = await whatsapp.sendMessage(id_event, {
            target,
            message: message || 'Silakan pilih:',
            choices,
            select: select || 'single',
            pollname: pollname || 'Polling'
        });

        if (!result.success) {
            const statusCode = result.errorType === 'TOKEN_ERROR' ? 401 : 500;
            return response[`sc${statusCode}`](result.message, result.error || {}, res);
        }

        return response.sc200('Polling WhatsApp berhasil dikirim', result.data, res);

    } catch (error) {
        logger.error('Error di controller sendPoll WhatsApp', {
            error: error.message
        });
        return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
    }
};

/**
 * Endpoint untuk mengirim lokasi WhatsApp
 * POST /api/notification/whatsapp/send-location
 */
Controller.sendLocation = async (req, res) => {
    try {
        const {
            id_event,
            target,
            latitude,
            longitude,
            message
        } = req.body;

        if (isEmpty(id_event)) {
            return response.sc400('Parameter id_event wajib diisi', {}, res);
        }

        if (isEmpty(target)) {
            return response.sc400('Parameter target wajib diisi', {}, res);
        }

        if (isEmpty(latitude) || isEmpty(longitude)) {
            return response.sc400('Parameter latitude dan longitude wajib diisi', {}, res);
        }

        const location = `${latitude},${longitude}`;

        const result = await whatsapp.sendMessage(id_event, {
            target,
            location,
            message: message || 'Lokasi'
        });

        if (!result.success) {
            const statusCode = result.errorType === 'TOKEN_ERROR' ? 401 : 500;
            return response[`sc${statusCode}`](result.message, result.error || {}, res);
        }

        return response.sc200('Lokasi WhatsApp berhasil dikirim', result.data, res);

    } catch (error) {
        logger.error('Error di controller sendLocation WhatsApp', {
            error: error.message
        });
        return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
    }
};

/**
 * Fungsi helper untuk mengirim notifikasi ke user tertentu
 * Bisa dipanggil dari controller atau service lain
 * @param {number} userId - ID User
 * @param {number} idEvent - ID Event (untuk ambil token)
 * @param {string} messageText - Text pesan
 * @param {Object} options - Opsi tambahan (url, schedule, dll)
 */
Controller.sendNotificationToUser = async (userId, idEvent, messageText, options = {}) => {
    try {
        if (!userId || userId <= 0) {
            throw new Error('User ID tidak valid');
        }

        if (!idEvent || idEvent <= 0) {
            throw new Error('Event ID tidak valid');
        }

        if (!messageText || messageText.trim() === '') {
            throw new Error('Pesan tidak boleh kosong');
        }

        logger.info('Mengambil data user dari view_profile', {
            userId,
            idEvent
        });

        const sql = {
            sql: `SELECT 
                    id_profile,
                    username,
                    nama_lengkap,
                    nmr_tlpn,
                    foto,
                    level,
                    grup
                FROM view_profile 
                WHERE created_by = ? AND nmr_tlpn IS NOT NULL AND nmr_tlpn != ''
                LIMIT 1`,
            param: [userId]
        };

        const userData = await helper.runSQL(sql);

        if (!userData || userData.length === 0) {
            logger.warn('User tidak ditemukan atau nomor telepon kosong', {
                userId,
                idEvent
            });
            return {
                success: false,
                message: 'User tidak ditemukan atau nomor telepon tidak tersedia',
                data: null,
                error: {
                    message: 'User not found'
                },
                errorType: 'USER_NOT_FOUND'
            };
        }

        const userProfile = userData[0];
        const phone = userProfile.nmr_tlpn;
        const name = userProfile.nama_lengkap;

        logger.info('Data user berhasil diambil', {
            userId,
            username: userProfile.username,
            phone: phone.substring(0, 5) + '***',
            nameLength: name ? name.length : 0
        });

        const target = whatsapp.formatTargetWithVariable(phone, name);

        const result = await whatsapp.sendMessage(idEvent, {
            target,
            message: messageText,
            typing: true,
            ...options
        });

        if (result.success) {
            logger.info('Notifikasi WhatsApp berhasil dikirim ke user', {
                userId,
                username: userProfile.username,
                requestId: result.data?.requestid
            });
        } else {
            logger.error('Gagal mengirim notifikasi WhatsApp ke user', {
                userId,
                username: userProfile.username,
                error: result.message,
                errorType: result.errorType
            });
        }

        return result;

    } catch (error) {
        logger.error('Error sendNotificationToUser', {
            error: error.message,
            userId,
            idEvent,
            stack: error.stack
        });

        return {
            success: false,
            message: error.message,
            data: null,
            error: {
                message: error.message
            },
            errorType: 'SYSTEM_ERROR'
        };
    }
};

/**
 * Fungsi helper untuk send notification ke multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {number} idEvent - ID Event
 * @param {string} messageText - Text pesan
 * @param {Object} options - Opsi tambahan
 */
Controller.sendNotificationToUsers = async (userIds, idEvent, messageText, options = {}) => {
    try {
        if (!Array.isArray(userIds) || userIds.length === 0) {
            throw new Error('Parameter userIds harus berupa array dan tidak boleh kosong');
        }

        if (!idEvent || idEvent <= 0) {
            throw new Error('Event ID tidak valid');
        }

        if (!messageText || messageText.trim() === '') {
            throw new Error('Pesan tidak boleh kosong');
        }

        logger.info('Mengambil data multiple users dari view_profile', {
            userCount: userIds.length,
            idEvent
        });

        const placeholders = userIds.map(() => '?').join(',');

        const sql = {
            sql: `SELECT 
                    id_profile,
                    created_by as id_user,
                    username,
                    nama_lengkap,
                    nmr_tlpn,
                    level,
                    grup
                FROM view_profile 
                WHERE created_by IN (${placeholders}) 
                AND nmr_tlpn IS NOT NULL 
                AND nmr_tlpn != ''
                ORDER BY created_by ASC`,
            param: userIds
        };

        const usersData = await helper.runSQL(sql);

        if (!usersData || usersData.length === 0) {
            logger.warn('Tidak ada user dengan nomor telepon yang valid', {
                requestedUserCount: userIds.length,
                idEvent
            });
            return {
                success: false,
                message: 'Tidak ada user dengan nomor telepon yang valid',
                data: {
                    requested: userIds.length,
                    found: 0
                },
                error: {
                    message: 'No valid users found'
                },
                errorType: 'NO_USERS_FOUND'
            };
        }

        logger.info('Data users berhasil diambil', {
            requestedUserCount: userIds.length,
            foundUserCount: usersData.length
        });

        const messages = usersData.map((user, index) => ({
            target: whatsapp.formatTargetWithVariable(user.nmr_tlpn, user.nama_lengkap),
            message: messageText,
            delay: options.delay ? (parseInt(options.delay) + (index * 2)).toString() : index.toString()
        }));

        const result = await whatsapp.sendBulkMessages(idEvent, messages);

        if (result.success) {
            result.data.usersSent = usersData.map(u => ({
                id: u.id_user,
                username: u.username,
                name: u.nama_lengkap
            }));

            logger.info('Bulk notifikasi WhatsApp berhasil dikirim', {
                userCount: usersData.length,
                requestId: result.data?.requestid
            });
        } else {
            logger.error('Gagal mengirim bulk notifikasi WhatsApp', {
                userCount: usersData.length,
                error: result.message,
                errorType: result.errorType
            });
        }

        return result;

    } catch (error) {
        logger.error('Error sendNotificationToUsers', {
            error: error.message,
            userCount: userIds?.length,
            idEvent,
            stack: error.stack
        });

        return {
            success: false,
            message: error.message,
            data: null,
            error: {
                message: error.message
            },
            errorType: 'SYSTEM_ERROR'
        };
    }
};

/**
 * Endpoint untuk mengirim notifikasi ke single user
 * POST /api/notification/whatsapp/send-to-user
 */
Controller.sendToUser = async (req, res) => {
    try {
        const {
            id_event,
            user_id,
            message,
            url,
            schedule,
            delay,
            typing
        } = req.body;

        if (isEmpty(id_event)) {
            return response.sc400('Parameter id_event wajib diisi', {}, res);
        }

        if (isEmpty(user_id)) {
            return response.sc400('Parameter user_id wajib diisi', {}, res);
        }

        if (isEmpty(message)) {
            return response.sc400('Parameter message wajib diisi', {}, res);
        }

        const result = await Controller.sendNotificationToUser(
            user_id,
            id_event,
            message, {
                url,
                schedule,
                delay,
                typing: typing !== undefined ? typing : true
            }
        );

        if (!result.success) {
            const statusCode = result.errorType === 'TOKEN_ERROR' ? 401 :
                result.errorType === 'USER_NOT_FOUND' ? 404 : 500;
            return response[`sc${statusCode}`](result.message, result.error || {}, res);
        }

        return response.sc200('Pesan WhatsApp berhasil dikirim ke user', result.data, res);

    } catch (error) {
        logger.error('Error di endpoint sendToUser', {
            error: error.message
        });
        return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
    }
};

/**
 * Endpoint untuk mengirim notifikasi ke multiple users
 * POST /api/notification/whatsapp/send-to-users
 */
Controller.sendToUsers = async (req, res) => {
    try {
        const {
            id_event,
            user_ids,
            message,
            delay,
            url
        } = req.body;

        if (isEmpty(id_event)) {
            return response.sc400('Parameter id_event wajib diisi', {}, res);
        }

        if (!Array.isArray(user_ids) || user_ids.length === 0) {
            return response.sc400('Parameter user_ids harus berupa array dan tidak boleh kosong', {}, res);
        }

        if (isEmpty(message)) {
            return response.sc400('Parameter message wajib diisi', {}, res);
        }

        const result = await Controller.sendNotificationToUsers(
            user_ids,
            id_event,
            message, {
                delay,
                url
            }
        );

        if (!result.success) {
            const statusCode = result.errorType === 'TOKEN_ERROR' ? 401 :
                result.errorType === 'NO_USERS_FOUND' ? 404 : 500;
            return response[`sc${statusCode}`](result.message, result.error || {}, res);
        }

        return response.sc200('Pesan WhatsApp berhasil dikirim ke multiple users', result.data, res);

    } catch (error) {
        logger.error('Error di endpoint sendToUsers', {
            error: error.message
        });
        return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
    }
};

module.exports = Controller;