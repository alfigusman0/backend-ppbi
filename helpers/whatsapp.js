/* Config */
const database = require('../config/database');
const redis = require('../config/redis');

/* Libraries */
const axios = require('axios');
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
            filename: "./logs/whatsapp-%DATE%.log",
            zippedArchive: true,
            maxSize: "100m",
            maxFiles: "14d"
        }),
    ]
});

const whatsapp = {};
const redisPrefix = process.env.REDIS_PREFIX + "whatsapp:";

// Validasi environment variables
const validateEnvVariables = () => {
    const requiredEnv = ['FONNTE_API_HOST', 'FONNTE_API_ENDPOINT'];
    const missing = requiredEnv.filter(env => !process.env[env]);
    
    if (missing.length > 0) {
        logger.warn('Environment variables yang hilang:', { missing });
    }

    return {
        apiHost: process.env.FONNTE_API_HOST || 'https://api.fonnte.com',
        apiEndpoint: process.env.FONNTE_API_ENDPOINT || '/send'
    };
};

/**
 * Ambil Fonnte Token dari database berdasarkan id_event
 * @param {number} idEvent - ID Event
 * @returns {Promise<string>} Token Fonnte
 * @throws {Error} Jika token tidak ditemukan
 */
whatsapp.getTokenByEvent = async (idEvent) => {
    try {
        if (!idEvent || idEvent <= 0) {
            throw new Error('ID Event tidak valid');
        }

        const cacheKey = redisPrefix + `token:${idEvent}`;
        if (process.env.REDIS_ACTIVE === 'ON') {
            try {
                const cachedToken = await redis.get(cacheKey);
                if (cachedToken) {
                    logger.info('Token WhatsApp dari cache', { idEvent });
                    return cachedToken;
                }
            } catch (redisError) {
                logger.warn('Redis get error:', { error: redisError.message });
            }
        }

        const sql = {
            sql: "SELECT setting FROM tbl_setting WHERE id_event = ? AND nama_setting = 'Whatsapp' LIMIT 1",
            param: [idEvent]
        };

        const result = await helper.runSQL(sql);

        if (!result || result.length === 0) {
            throw new Error(`Token WhatsApp untuk event ID ${idEvent} tidak ditemukan di database`);
        }

        const token = result[0].setting;

        if (!token || token.trim() === '') {
            throw new Error(`Token WhatsApp untuk event ID ${idEvent} kosong atau tidak valid`);
        }

        if (process.env.REDIS_ACTIVE === 'ON') {
            try {
                await redis.set(
                    cacheKey, 
                    token, 
                    'EX', 
                    60 * 60 * 24 * (process.env.REDIS_DAY || 1)
                );
            } catch (redisError) {
                logger.warn('Redis set error:', { error: redisError.message });
            }
        }

        return token;

    } catch (error) {
        logger.error('Error mengambil token WhatsApp dari database', {
            idEvent,
            error: error.message
        });
        throw error;
    }
};

/**
 * Fungsi utama untuk mengirim pesan WhatsApp melalui Fonnte API
 * @param {number} idEvent - ID Event (untuk mengambil token dari database)
 * @param {Object} params - Parameter pengiriman
 * @param {string} params.target - Nomor tujuan (wajib). Format: '08123456789' atau '08123456789|Nama|Role'
 * @param {string} params.message - Pesan yang akan dikirim (opsional jika ada url/file)
 * @param {string} params.url - URL file/gambar/video/audio yang akan dikirim (opsional)
 * @param {string} params.filename - Nama file custom (opsional, hanya untuk non-image/video)
 * @param {number} params.schedule - Unix timestamp untuk jadwal pengiriman (opsional)
 * @param {string} params.delay - Delay antar pengiriman, format: '2' atau '1-10' (opsional)
 * @param {string} params.countryCode - Kode negara, default '62' (opsional)
 * @param {string} params.location - Lokasi GPS format: 'latitude,longitude' (opsional)
 * @param {boolean} params.typing - Indikator mengetik, default false (opsional)
 * @param {string} params.choices - Pilihan polling, dipisah koma, min 2 max 12 (opsional)
 * @param {string} params.select - Tipe polling: 'single' atau 'multiple' (opsional)
 * @param {string} params.pollname - Nama polling (opsional)
 * @param {boolean} params.connectOnly - Kirim hanya jika device terhubung, default true (opsional)
 * @param {number} params.followup - Delay dalam detik sebelum kirim pesan (opsional)
 * @param {string} params.data - Data gabungan dalam format JSON string (opsional)
 * @param {boolean} params.sequence - Kirim secara berurutan, default false (opsional)
 * @param {boolean} params.preview - Preview link dalam pesan, default true (opsional)
 * @returns {Promise<Object>} Response dengan format {success, message, data, error, errorType}
 */
whatsapp.sendMessage = async (idEvent, params) => {
    try {
        if (!idEvent) {
            throw new Error('Parameter idEvent wajib diisi');
        }

        if (!params || !params.target) {
            throw new Error('Parameter target wajib diisi');
        }

        const fontteConfig = validateEnvVariables();

        let token;
        try {
            token = await whatsapp.getTokenByEvent(idEvent);
        } catch (tokenError) {
            logger.error('Gagal mengambil token WhatsApp', {
                idEvent,
                error: tokenError.message
            });
            return {
                success: false,
                message: tokenError.message,
                data: null,
                error: { message: tokenError.message },
                errorType: 'TOKEN_ERROR'
            };
        }

        const formData = {
            target: params.target,
        };

        if (params.message) formData.message = params.message;
        if (params.url) formData.url = params.url;
        if (params.filename) formData.filename = params.filename;
        if (params.schedule) formData.schedule = params.schedule;
        if (params.delay) formData.delay = String(params.delay);
        if (params.countryCode) formData.countryCode = String(params.countryCode);
        if (params.location) formData.location = params.location;
        if (typeof params.typing !== 'undefined') formData.typing = params.typing;
        if (params.choices) formData.choices = params.choices;
        if (params.select) formData.select = params.select;
        if (params.pollname) formData.pollname = params.pollname;
        if (typeof params.connectOnly !== 'undefined') formData.connectOnly = params.connectOnly;
        if (params.followup) formData.followup = params.followup;
        if (params.data) formData.data = params.data;
        if (typeof params.sequence !== 'undefined') formData.sequence = params.sequence;
        if (typeof params.preview !== 'undefined') formData.preview = params.preview;

        logger.info('Mengirim pesan WhatsApp via Fonnte', {
            idEvent,
            target: params.target,
            hasMessage: !!params.message,
            hasUrl: !!params.url,
            apiHost: fontteConfig.apiHost,
            timestamp: new Date().toISOString()
        });

        const apiUrl = fontteConfig.apiHost + fontteConfig.apiEndpoint;

        const config = {
            method: 'POST',
            url: apiUrl,
            headers: {
                'Authorization': token,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: new URLSearchParams(formData).toString(),
            timeout: 30000,
        };

        const response = await axios(config);

        if (response.data.status === false) {
            logger.error('Gagal mengirim pesan WhatsApp', {
                idEvent,
                reason: response.data.reason,
                requestid: response.data.requestid,
                target: params.target,
                apiUrl
            });
            
            return {
                success: false,
                message: `Gagal mengirim pesan: ${response.data.reason}`,
                data: response.data,
                error: response.data,
                errorType: 'FONNTE_API_ERROR'
            };
        }

        logger.info('Berhasil mengirim pesan WhatsApp', {
            idEvent,
            detail: response.data.detail,
            id: response.data.id,
            requestid: response.data.requestid,
            target: response.data.target,
            apiUrl
        });

        return {
            success: true,
            message: 'Pesan berhasil dikirim',
            data: response.data,
            error: null,
            errorType: null
        };

    } catch (error) {
        let errorMessage = 'Terjadi kesalahan saat mengirim pesan WhatsApp';
        let errorDetail = {};
        let errorType = 'UNKNOWN_ERROR';

        if (error.response) {
            errorMessage = error.response.data?.reason || error.response.statusText;
            errorDetail = {
                status: error.response.status,
                data: error.response.data,
                requestid: error.response.data?.requestid
            };
            errorType = 'FONNTE_API_ERROR';
        } else if (error.request) {
            errorMessage = 'Tidak ada response dari server Fonnte - koneksi timeout atau network error';
            errorDetail = {
                message: 'Request timeout atau network error',
                code: error.code
            };
            errorType = 'NETWORK_ERROR';
        } else {
            errorMessage = error.message;
            errorDetail = {
                message: error.message
            };
            errorType = 'REQUEST_SETUP_ERROR';
        }

        logger.error('Error mengirim WhatsApp', {
            idEvent: params?.idEvent,
            error: errorMessage,
            detail: errorDetail,
            errorType,
            target: params?.target
        });

        return {
            success: false,
            message: errorMessage,
            data: null,
            error: errorDetail,
            errorType
        };
    }
};

/**
 * Fungsi untuk mengirim pesan ke multiple target dengan custom message per target
 * @param {number} idEvent - ID Event
 * @param {Array} messages - Array of message objects
 * @param {string} messages[].target - Nomor target
 * @param {string} messages[].message - Pesan untuk target ini
 * @param {string} messages[].url - URL attachment (opsional)
 * @param {string} messages[].delay - Delay sebelum kirim (opsional)
 * @returns {Promise<Object>} Response dari API
 */
whatsapp.sendBulkMessages = async (idEvent, messages) => {
    try {
        if (!Array.isArray(messages) || messages.length === 0) {
            throw new Error('Parameter messages harus berupa array dan tidak boleh kosong');
        }

        for (const msg of messages) {
            if (!msg.target) {
                throw new Error('Setiap message harus memiliki target');
            }
        }

        logger.info('Mengirim bulk messages', {
            idEvent,
            messagesCount: messages.length
        });

        const dataString = JSON.stringify(messages);

        const result = await whatsapp.sendMessage(idEvent, {
            target: messages[0].target,
            data: dataString,
            sequence: false
        });

        return result;

    } catch (error) {
        logger.error('Error mengirim bulk messages', {
            idEvent,
            error: error.message,
            messagesCount: messages?.length
        });

        return {
            success: false,
            message: error.message,
            data: null,
            error: { message: error.message },
            errorType: 'BULK_MESSAGE_ERROR'
        };
    }
};

/**
 * Helper untuk format target dengan variable
 * @param {string} phone - Nomor telepon
 * @param {string} name - Nama (variable {name})
 * @param {string} role - Role/variable tambahan (variable {var1})
 * @returns {string} Format: '08123456789|Name|Role'
 */
whatsapp.formatTargetWithVariable = (phone, name = '', role = '') => {
    let target = phone;
    if (name) target += `|${name}`;
    if (role) target += `|${role}`;
    return target;
};

/**
 * Helper untuk format multiple targets
 * @param {Array} targets - Array of objects {phone, name, role}
 * @returns {string} Format: '081xxx|Name1|Role1,082xxx|Name2|Role2'
 */
whatsapp.formatMultipleTargets = (targets) => {
    if (!Array.isArray(targets)) {
        throw new Error('Parameter targets harus berupa array');
    }

    return targets.map(t => 
        whatsapp.formatTargetWithVariable(t.phone, t.name, t.role)
    ).join(',');
};

/**
 * Invalidate token cache dari Redis
 * @param {number} idEvent - ID Event
 */
whatsapp.invalidateTokenCache = async (idEvent) => {
    try {
        if (process.env.REDIS_ACTIVE === 'ON') {
            const cacheKey = redisPrefix + `token:${idEvent}`;
            await redis.del(cacheKey);
            logger.info('Token cache dihapus', { idEvent });
        }
    } catch (error) {
        logger.warn('Error invalidating token cache', { 
            idEvent, 
            error: error.message 
        });
    }
};

/**
 * Get Fonnte API configuration
 * @returns {Object} {apiHost, apiEndpoint}
 */
whatsapp.getConfig = () => {
    return validateEnvVariables();
};

module.exports = whatsapp;