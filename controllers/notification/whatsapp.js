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
  level: 'info',
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
      filename: './logs/log-%DATE%.log',
      zippedArchive: true,
      maxSize: '100m',
      maxFiles: '14d',
    }),
  ],
});

const Controller = {};

// ===============================
// FUNGSI DENGAN ID_EVENT (EXISTING)
// ===============================

/**
 * Endpoint untuk mengirim pesan WhatsApp tunggal dengan token dari database berdasarkan id_event
 * Method: POST
 * URL: /api/notification/whatsapp/send
 *
 * @param {number} id_event - ID Event (wajib)
 * @param {string} target - Nomor tujuan WhatsApp (wajib)
 * @param {string} message - Pesan yang akan dikirim
 * @param {string} url - URL attachment (gambar/video/dokumen)
 * @param {string} filename - Nama file custom
 * @param {number} schedule - Unix timestamp untuk jadwal pengiriman
 * @param {string} delay - Delay pengiriman ('2' atau '1-10')
 * @param {string} countryCode - Kode negara (default: '62')
 * @param {string} location - Koordinat GPS ('latitude,longitude')
 * @param {boolean} typing - Indikator mengetik
 * @param {boolean} connectOnly - Kirim hanya jika device terhubung
 * @param {boolean} preview - Preview link
 *
 * @returns {Object} Response {success, message, data}
 *
 * Contoh Request Body:
 * {
 *   "id_event": 123,
 *   "target": "08123456789",
 *   "message": "Halo, ini pesan tes",
 *   "typing": true
 * }
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
      preview,
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
      preview,
    });

    if (!result.success) {
      const statusCode = result.errorType === 'TOKEN_ERROR' ? 401 : 500;
      return response[`sc${statusCode}`](result.message, result.error || {}, res);
    }

    return response.sc200('Pesan WhatsApp berhasil dikirim', result.data, res);
  } catch (error) {
    logger.error('Error di controller send WhatsApp', {
      error: error.message,
    });
    return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
  }
};

/**
 * Endpoint untuk mengirim pesan WhatsApp ke multiple target dengan custom message menggunakan token dari database
 * Method: POST
 * URL: /api/notification/whatsapp/send-bulk
 *
 * @param {number} id_event - ID Event (wajib)
 * @param {Array} messages - Array of message objects
 * @param {string} messages[].target - Nomor target (wajib)
 * @param {string} messages[].message - Pesan untuk target ini
 * @param {string} messages[].url - URL attachment
 * @param {string} messages[].delay - Delay sebelum kirim
 *
 * @returns {Object} Response {success, message, data}
 *
 * Contoh Request Body:
 * {
 *   "id_event": 123,
 *   "messages": [
 *     {
 *       "target": "08123456789",
 *       "message": "Halo User 1"
 *     },
 *     {
 *       "target": "08123456780",
 *       "message": "Halo User 2",
 *       "delay": "2"
 *     }
 *   ]
 * }
 */
Controller.sendBulk = async (req, res) => {
  try {
    const { id_event, messages } = req.body;

    if (isEmpty(id_event)) {
      return response.sc400('Parameter id_event wajib diisi', {}, res);
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return response.sc400(
        'Parameter messages harus berupa array dan tidak boleh kosong',
        {},
        res
      );
    }

    const result = await whatsapp.sendBulkMessages(id_event, messages);

    if (!result.success) {
      const statusCode = result.errorType === 'TOKEN_ERROR' ? 401 : 500;
      return response[`sc${statusCode}`](result.message, result.error || {}, res);
    }

    return response.sc200('Bulk pesan WhatsApp berhasil dikirim', result.data, res);
  } catch (error) {
    logger.error('Error di controller sendBulk WhatsApp', {
      error: error.message,
    });
    return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
  }
};

/**
 * Endpoint untuk mengirim polling WhatsApp dengan token dari database
 * Method: POST
 * URL: /api/notification/whatsapp/send-poll
 *
 * @param {number} id_event - ID Event (wajib)
 * @param {string} target - Nomor tujuan WhatsApp (wajib)
 * @param {string} message - Pesan polling
 * @param {string} choices - Pilihan polling (dipisah koma, min 2 max 12)
 * @param {string} select - Tipe polling: 'single' atau 'multiple'
 * @param {string} pollname - Nama polling
 *
 * @returns {Object} Response {success, message, data}
 *
 * Contoh Request Body:
 * {
 *   "id_event": 123,
 *   "target": "08123456789",
 *   "message": "Pilih makanan favorit:",
 *   "choices": "Pizza,Burger,Sushi,Ramen",
 *   "select": "single",
 *   "pollname": "Polling Makanan"
 * }
 */
Controller.sendPoll = async (req, res) => {
  try {
    const { id_event, target, message, choices, select, pollname } = req.body;

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
      pollname: pollname || 'Polling',
    });

    if (!result.success) {
      const statusCode = result.errorType === 'TOKEN_ERROR' ? 401 : 500;
      return response[`sc${statusCode}`](result.message, result.error || {}, res);
    }

    return response.sc200('Polling WhatsApp berhasil dikirim', result.data, res);
  } catch (error) {
    logger.error('Error di controller sendPoll WhatsApp', {
      error: error.message,
    });
    return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
  }
};

/**
 * Endpoint untuk mengirim lokasi WhatsApp dengan token dari database
 * Method: POST
 * URL: /api/notification/whatsapp/send-location
 *
 * @param {number} id_event - ID Event (wajib)
 * @param {string} target - Nomor tujuan WhatsApp (wajib)
 * @param {number} latitude - Koordinat latitude (wajib)
 * @param {number} longitude - Koordinat longitude (wajib)
 * @param {string} message - Pesan tambahan
 *
 * @returns {Object} Response {success, message, data}
 *
 * Contoh Request Body:
 * {
 *   "id_event": 123,
 *   "target": "08123456789",
 *   "latitude": -6.2088,
 *   "longitude": 106.8456,
 *   "message": "Lokasi kami"
 * }
 */
Controller.sendLocation = async (req, res) => {
  try {
    const { id_event, target, latitude, longitude, message } = req.body;

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
      message: message || 'Lokasi',
    });

    if (!result.success) {
      const statusCode = result.errorType === 'TOKEN_ERROR' ? 401 : 500;
      return response[`sc${statusCode}`](result.message, result.error || {}, res);
    }

    return response.sc200('Lokasi WhatsApp berhasil dikirim', result.data, res);
  } catch (error) {
    logger.error('Error di controller sendLocation WhatsApp', {
      error: error.message,
    });
    return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
  }
};

// ===============================
// FUNGSI BARU TANPA ID_EVENT (TOKEN DARI ENV)
// ===============================

/**
 * Endpoint untuk mengirim pesan WhatsApp tunggal dengan token dari environment variable
 * Method: POST
 * URL: /api/notification/whatsapp/send-with-env-token
 *
 * @param {string} target - Nomor tujuan WhatsApp (wajib)
 * @param {string} message - Pesan yang akan dikirim
 * @param {string} url - URL attachment (gambar/video/dokumen)
 * @param {string} filename - Nama file custom
 * @param {number} schedule - Unix timestamp untuk jadwal pengiriman
 * @param {string} delay - Delay pengiriman ('2' atau '1-10')
 * @param {string} countryCode - Kode negara (default: '62')
 * @param {string} location - Koordinat GPS ('latitude,longitude')
 * @param {boolean} typing - Indikator mengetik
 * @param {boolean} connectOnly - Kirim hanya jika device terhubung
 * @param {boolean} preview - Preview link
 *
 * @returns {Object} Response {success, message, data}
 *
 * Contoh Request Body:
 * {
 *   "target": "08123456789",
 *   "message": "Halo, ini pesan tes dengan token env",
 *   "typing": true
 * }
 */
Controller.sendWithEnvToken = async (req, res) => {
  try {
    const {
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
      preview,
    } = req.body;

    if (isEmpty(target)) {
      return response.sc400('Parameter target wajib diisi', {}, res);
    }

    // Cara 1: Menggunakan fungsi khusus sendMessageWithEnvToken
    const result = await whatsapp.sendMessageWithEnvToken({
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
      preview,
    });

    if (!result.success) {
      const statusCode = result.errorType === 'TOKEN_ERROR' ? 401 : 500;
      return response[`sc${statusCode}`](result.message, result.error || {}, res);
    }

    return response.sc200('Pesan WhatsApp berhasil dikirim (Env Token)', result.data, res);
  } catch (error) {
    logger.error('Error di controller sendWithEnvToken WhatsApp', {
      error: error.message,
    });
    return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
  }
};

/**
 * Endpoint untuk mengirim pesan WhatsApp tunggal dengan token dari environment variable (Cara 2)
 * Method: POST
 * URL: /api/notification/whatsapp/send-with-env
 *
 * @param {string} target - Nomor tujuan WhatsApp (wajib)
 * @param {string} message - Pesan yang akan dikirim
 * @param {string} url - URL attachment (gambar/video/dokumen)
 * @param {string} filename - Nama file custom
 * @param {number} schedule - Unix timestamp untuk jadwal pengiriman
 * @param {string} delay - Delay pengiriman ('2' atau '1-10')
 * @param {string} countryCode - Kode negara (default: '62')
 * @param {string} location - Koordinat GPS ('latitude,longitude')
 * @param {boolean} typing - Indikator mengetik
 * @param {boolean} connectOnly - Kirim hanya jika device terhubung
 * @param {boolean} preview - Preview link
 *
 * @returns {Object} Response {success, message, data}
 *
 * Contoh Request Body:
 * {
 *   "target": "08123456789",
 *   "message": "Halo, ini pesan tes dengan token env (Cara 2)",
 *   "typing": true
 * }
 */
Controller.sendWithEnv = async (req, res) => {
  try {
    const {
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
      preview,
    } = req.body;

    if (isEmpty(target)) {
      return response.sc400('Parameter target wajib diisi', {}, res);
    }

    // Cara 2: Menggunakan sendMessage dengan id_event null
    const result = await whatsapp.sendMessage(null, {
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
      preview,
    });

    if (!result.success) {
      const statusCode = result.errorType === 'TOKEN_ERROR' ? 401 : 500;
      return response[`sc${statusCode}`](result.message, result.error || {}, res);
    }

    return response.sc200('Pesan WhatsApp berhasil dikirim (Env Token - Cara 2)', result.data, res);
  } catch (error) {
    logger.error('Error di controller sendWithEnv WhatsApp', {
      error: error.message,
    });
    return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
  }
};

/**
 * Endpoint untuk mengirim pesan WhatsApp ke multiple target dengan token dari environment variable
 * Method: POST
 * URL: /api/notification/whatsapp/send-bulk-with-env
 *
 * @param {Array} messages - Array of message objects
 * @param {string} messages[].target - Nomor target (wajib)
 * @param {string} messages[].message - Pesan untuk target ini
 * @param {string} messages[].url - URL attachment
 * @param {string} messages[].delay - Delay sebelum kirim
 *
 * @returns {Object} Response {success, message, data}
 *
 * Contoh Request Body:
 * {
 *   "messages": [
 *     {
 *       "target": "08123456789",
 *       "message": "Halo User 1 dengan token env"
 *     },
 *     {
 *       "target": "08123456780",
 *       "message": "Halo User 2 dengan token env",
 *       "delay": "2"
 *     }
 *   ]
 * }
 */
Controller.sendBulkWithEnv = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return response.sc400(
        'Parameter messages harus berupa array dan tidak boleh kosong',
        {},
        res
      );
    }

    // Menggunakan sendBulkMessages dengan id_event null
    const result = await whatsapp.sendBulkMessages(null, messages);

    if (!result.success) {
      const statusCode = result.errorType === 'TOKEN_ERROR' ? 401 : 500;
      return response[`sc${statusCode}`](result.message, result.error || {}, res);
    }

    return response.sc200('Bulk pesan WhatsApp berhasil dikirim (Env Token)', result.data, res);
  } catch (error) {
    logger.error('Error di controller sendBulkWithEnv WhatsApp', {
      error: error.message,
    });
    return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
  }
};

/**
 * Endpoint untuk mengirim polling WhatsApp dengan token dari environment variable
 * Method: POST
 * URL: /api/notification/whatsapp/send-poll-with-env
 *
 * @param {string} target - Nomor tujuan WhatsApp (wajib)
 * @param {string} message - Pesan polling
 * @param {string} choices - Pilihan polling (dipisah koma, min 2 max 12)
 * @param {string} select - Tipe polling: 'single' atau 'multiple'
 * @param {string} pollname - Nama polling
 *
 * @returns {Object} Response {success, message, data}
 *
 * Contoh Request Body:
 * {
 *   "target": "08123456789",
 *   "message": "Pilih makanan favorit:",
 *   "choices": "Pizza,Burger,Sushi,Ramen",
 *   "select": "single",
 *   "pollname": "Polling Makanan"
 * }
 */
Controller.sendPollWithEnv = async (req, res) => {
  try {
    const { target, message, choices, select, pollname } = req.body;

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

    const result = await whatsapp.sendMessage(null, {
      target,
      message: message || 'Silakan pilih:',
      choices,
      select: select || 'single',
      pollname: pollname || 'Polling',
    });

    if (!result.success) {
      const statusCode = result.errorType === 'TOKEN_ERROR' ? 401 : 500;
      return response[`sc${statusCode}`](result.message, result.error || {}, res);
    }

    return response.sc200('Polling WhatsApp berhasil dikirim (Env Token)', result.data, res);
  } catch (error) {
    logger.error('Error di controller sendPollWithEnv WhatsApp', {
      error: error.message,
    });
    return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
  }
};

/**
 * Endpoint untuk mengirim lokasi WhatsApp dengan token dari environment variable
 * Method: POST
 * URL: /api/notification/whatsapp/send-location-with-env
 *
 * @param {string} target - Nomor tujuan WhatsApp (wajib)
 * @param {number} latitude - Koordinat latitude (wajib)
 * @param {number} longitude - Koordinat longitude (wajib)
 * @param {string} message - Pesan tambahan
 *
 * @returns {Object} Response {success, message, data}
 *
 * Contoh Request Body:
 * {
 *   "target": "08123456789",
 *   "latitude": -6.2088,
 *   "longitude": 106.8456,
 *   "message": "Lokasi kami"
 * }
 */
Controller.sendLocationWithEnv = async (req, res) => {
  try {
    const { target, latitude, longitude, message } = req.body;

    if (isEmpty(target)) {
      return response.sc400('Parameter target wajib diisi', {}, res);
    }

    if (isEmpty(latitude) || isEmpty(longitude)) {
      return response.sc400('Parameter latitude dan longitude wajib diisi', {}, res);
    }

    const location = `${latitude},${longitude}`;

    const result = await whatsapp.sendMessage(null, {
      target,
      location,
      message: message || 'Lokasi',
    });

    if (!result.success) {
      const statusCode = result.errorType === 'TOKEN_ERROR' ? 401 : 500;
      return response[`sc${statusCode}`](result.message, result.error || {}, res);
    }

    return response.sc200('Lokasi WhatsApp berhasil dikirim (Env Token)', result.data, res);
  } catch (error) {
    logger.error('Error di controller sendLocationWithEnv WhatsApp', {
      error: error.message,
    });
    return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
  }
};

// ===============================
// FUNGSI HELPER (EXISTING)
// ===============================

/**
 * Fungsi helper untuk mengirim notifikasi ke user tertentu dengan token dari database
 * Bisa dipanggil dari controller atau service lain
 *
 * @param {number} userId - ID User (wajib)
 * @param {number} idEvent - ID Event (wajib)
 * @param {string} messageText - Text pesan (wajib)
 * @param {Object} options - Opsi tambahan {url, schedule, delay, typing}
 *
 * @returns {Object} Result {success, message, data, error, errorType}
 *
 * Contoh Penggunaan:
 * const result = await Controller.sendNotificationToUser(123, 456, "Halo user!", {typing: true});
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
      idEvent,
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
      param: [userId],
    };

    const userData = await helper.runSQL(sql);

    if (!userData || userData.length === 0) {
      logger.warn('User tidak ditemukan atau nomor telepon kosong', {
        userId,
        idEvent,
      });
      return {
        success: false,
        message: 'User tidak ditemukan atau nomor telepon tidak tersedia',
        data: null,
        error: {
          message: 'User not found',
        },
        errorType: 'USER_NOT_FOUND',
      };
    }

    const userProfile = userData[0];
    const phone = userProfile.nmr_tlpn;
    const name = userProfile.nama_lengkap;

    logger.info('Data user berhasil diambil', {
      userId,
      username: userProfile.username,
      phone: phone.substring(0, 5) + '***',
      nameLength: name ? name.length : 0,
    });

    const target = whatsapp.formatTargetWithVariable(phone, name);

    const result = await whatsapp.sendMessage(idEvent, {
      target,
      message: messageText,
      typing: true,
      ...options,
    });

    if (result.success) {
      logger.info('Notifikasi WhatsApp berhasil dikirim ke user', {
        userId,
        username: userProfile.username,
        requestId: result.data?.requestid,
      });
    } else {
      logger.error('Gagal mengirim notifikasi WhatsApp ke user', {
        userId,
        username: userProfile.username,
        error: result.message,
        errorType: result.errorType,
      });
    }

    return result;
  } catch (error) {
    logger.error('Error sendNotificationToUser', {
      error: error.message,
      userId,
      idEvent,
      stack: error.stack,
    });

    return {
      success: false,
      message: error.message,
      data: null,
      error: {
        message: error.message,
      },
      errorType: 'SYSTEM_ERROR',
    };
  }
};

/**
 * Fungsi helper untuk send notification ke multiple users dengan token dari database
 *
 * @param {Array} userIds - Array of user IDs (wajib)
 * @param {number} idEvent - ID Event (wajib)
 * @param {string} messageText - Text pesan (wajib)
 * @param {Object} options - Opsi tambahan {delay, url}
 *
 * @returns {Object} Result {success, message, data, error, errorType}
 *
 * Contoh Penggunaan:
 * const result = await Controller.sendNotificationToUsers([123, 456], 789, "Halo semua user!", {delay: "1"});
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
      idEvent,
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
      param: userIds,
    };

    const usersData = await helper.runSQL(sql);

    if (!usersData || usersData.length === 0) {
      logger.warn('Tidak ada user dengan nomor telepon yang valid', {
        requestedUserCount: userIds.length,
        idEvent,
      });
      return {
        success: false,
        message: 'Tidak ada user dengan nomor telepon yang valid',
        data: {
          requested: userIds.length,
          found: 0,
        },
        error: {
          message: 'No valid users found',
        },
        errorType: 'NO_USERS_FOUND',
      };
    }

    logger.info('Data users berhasil diambil', {
      requestedUserCount: userIds.length,
      foundUserCount: usersData.length,
    });

    const messages = usersData.map((user, index) => ({
      target: whatsapp.formatTargetWithVariable(user.nmr_tlpn, user.nama_lengkap),
      message: messageText,
      delay: options.delay ? (parseInt(options.delay) + index * 2).toString() : index.toString(),
    }));

    const result = await whatsapp.sendBulkMessages(idEvent, messages);

    if (result.success) {
      result.data.usersSent = usersData.map(u => ({
        id: u.id_user,
        username: u.username,
        name: u.nama_lengkap,
      }));

      logger.info('Bulk notifikasi WhatsApp berhasil dikirim', {
        userCount: usersData.length,
        requestId: result.data?.requestid,
      });
    } else {
      logger.error('Gagal mengirim bulk notifikasi WhatsApp', {
        userCount: usersData.length,
        error: result.message,
        errorType: result.errorType,
      });
    }

    return result;
  } catch (error) {
    logger.error('Error sendNotificationToUsers', {
      error: error.message,
      userCount: userIds?.length,
      idEvent,
      stack: error.stack,
    });

    return {
      success: false,
      message: error.message,
      data: null,
      error: {
        message: error.message,
      },
      errorType: 'SYSTEM_ERROR',
    };
  }
};

/**
 * Endpoint untuk mengirim notifikasi ke single user dengan token dari database
 * Method: POST
 * URL: /api/notification/whatsapp/send-to-user
 *
 * @param {number} id_event - ID Event (wajib)
 * @param {number} user_id - ID User (wajib)
 * @param {string} message - Pesan (wajib)
 * @param {string} url - URL attachment
 * @param {number} schedule - Unix timestamp untuk jadwal
 * @param {string} delay - Delay pengiriman
 * @param {boolean} typing - Indikator mengetik
 *
 * @returns {Object} Response {success, message, data}
 *
 * Contoh Request Body:
 * {
 *   "id_event": 123,
 *   "user_id": 456,
 *   "message": "Halo user, ini notifikasi untuk Anda",
 *   "typing": true
 * }
 */
Controller.sendToUser = async (req, res) => {
  try {
    const { id_event, user_id, message, url, schedule, delay, typing } = req.body;

    if (isEmpty(id_event)) {
      return response.sc400('Parameter id_event wajib diisi', {}, res);
    }

    if (isEmpty(user_id)) {
      return response.sc400('Parameter user_id wajib diisi', {}, res);
    }

    if (isEmpty(message)) {
      return response.sc400('Parameter message wajib diisi', {}, res);
    }

    const result = await Controller.sendNotificationToUser(user_id, id_event, message, {
      url,
      schedule,
      delay,
      typing: typing !== undefined ? typing : true,
    });

    if (!result.success) {
      const statusCode =
        result.errorType === 'TOKEN_ERROR'
          ? 401
          : result.errorType === 'USER_NOT_FOUND'
          ? 404
          : 500;
      return response[`sc${statusCode}`](result.message, result.error || {}, res);
    }

    return response.sc200('Pesan WhatsApp berhasil dikirim ke user', result.data, res);
  } catch (error) {
    logger.error('Error di endpoint sendToUser', {
      error: error.message,
    });
    return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
  }
};

/**
 * Endpoint untuk mengirim notifikasi ke multiple users dengan token dari database
 * Method: POST
 * URL: /api/notification/whatsapp/send-to-users
 *
 * @param {number} id_event - ID Event (wajib)
 * @param {Array} user_ids - Array of user IDs (wajib)
 * @param {string} message - Pesan (wajib)
 * @param {string} delay - Delay antar pengiriman
 * @param {string} url - URL attachment
 *
 * @returns {Object} Response {success, message, data}
 *
 * Contoh Request Body:
 * {
 *   "id_event": 123,
 *   "user_ids": [456, 789, 101],
 *   "message": "Halo semua user, ini broadcast message",
 *   "delay": "1"
 * }
 */
Controller.sendToUsers = async (req, res) => {
  try {
    const { id_event, user_ids, message, delay, url } = req.body;

    if (isEmpty(id_event)) {
      return response.sc400('Parameter id_event wajib diisi', {}, res);
    }

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return response.sc400(
        'Parameter user_ids harus berupa array dan tidak boleh kosong',
        {},
        res
      );
    }

    if (isEmpty(message)) {
      return response.sc400('Parameter message wajib diisi', {}, res);
    }

    const result = await Controller.sendNotificationToUsers(user_ids, id_event, message, {
      delay,
      url,
    });

    if (!result.success) {
      const statusCode =
        result.errorType === 'TOKEN_ERROR'
          ? 401
          : result.errorType === 'NO_USERS_FOUND'
          ? 404
          : 500;
      return response[`sc${statusCode}`](result.message, result.error || {}, res);
    }

    return response.sc200('Pesan WhatsApp berhasil dikirim ke multiple users', result.data, res);
  } catch (error) {
    logger.error('Error di endpoint sendToUsers', {
      error: error.message,
    });
    return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
  }
};

// ===============================
// FUNGSI HELPER BARU TANPA ID_EVENT
// ===============================

/**
 * Fungsi helper untuk mengirim notifikasi ke user tertentu dengan token dari environment variable
 *
 * @param {number} userId - ID User (wajib)
 * @param {string} messageText - Text pesan (wajib)
 * @param {Object} options - Opsi tambahan {url, schedule, delay, typing}
 *
 * @returns {Object} Result {success, message, data, error, errorType}
 *
 * Contoh Penggunaan:
 * const result = await Controller.sendNotificationToUserWithEnv(123, "Halo user dengan token env!", {typing: true});
 */
Controller.sendNotificationToUserWithEnv = async (userId, messageText, options = {}) => {
  try {
    if (!userId || userId <= 0) {
      throw new Error('User ID tidak valid');
    }

    if (!messageText || messageText.trim() === '') {
      throw new Error('Pesan tidak boleh kosong');
    }

    logger.info('Mengambil data user dari view_profile (Env Token)', {
      userId,
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
      param: [userId],
    };

    const userData = await helper.runSQL(sql);

    if (!userData || userData.length === 0) {
      logger.warn('User tidak ditemukan atau nomor telepon kosong (Env Token)', {
        userId,
      });
      return {
        success: false,
        message: 'User tidak ditemukan atau nomor telepon tidak tersedia',
        data: null,
        error: {
          message: 'User not found',
        },
        errorType: 'USER_NOT_FOUND',
      };
    }

    const userProfile = userData[0];
    const phone = userProfile.nmr_tlpn;
    const name = userProfile.nama_lengkap;

    logger.info('Data user berhasil diambil (Env Token)', {
      userId,
      username: userProfile.username,
      phone: phone.substring(0, 5) + '***',
      nameLength: name ? name.length : 0,
    });

    const target = whatsapp.formatTargetWithVariable(phone, name);

    // Menggunakan token dari environment variable (idEvent = null)
    const result = await whatsapp.sendMessage(null, {
      target,
      message: messageText,
      typing: true,
      ...options,
    });

    if (result.success) {
      logger.info('Notifikasi WhatsApp berhasil dikirim ke user (Env Token)', {
        userId,
        username: userProfile.username,
        requestId: result.data?.requestid,
      });
    } else {
      logger.error('Gagal mengirim notifikasi WhatsApp ke user (Env Token)', {
        userId,
        username: userProfile.username,
        error: result.message,
        errorType: result.errorType,
      });
    }

    return result;
  } catch (error) {
    logger.error('Error sendNotificationToUserWithEnv', {
      error: error.message,
      userId,
      stack: error.stack,
    });

    return {
      success: false,
      message: error.message,
      data: null,
      error: {
        message: error.message,
      },
      errorType: 'SYSTEM_ERROR',
    };
  }
};

/**
 * Fungsi helper untuk send notification ke multiple users dengan token dari environment variable
 *
 * @param {Array} userIds - Array of user IDs (wajib)
 * @param {string} messageText - Text pesan (wajib)
 * @param {Object} options - Opsi tambahan {delay, url}
 *
 * @returns {Object} Result {success, message, data, error, errorType}
 *
 * Contoh Penggunaan:
 * const result = await Controller.sendNotificationToUsersWithEnv([123, 456], "Halo semua user dengan token env!", {delay: "1"});
 */
Controller.sendNotificationToUsersWithEnv = async (userIds, messageText, options = {}) => {
  try {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('Parameter userIds harus berupa array dan tidak boleh kosong');
    }

    if (!messageText || messageText.trim() === '') {
      throw new Error('Pesan tidak boleh kosong');
    }

    logger.info('Mengambil data multiple users dari view_profile (Env Token)', {
      userCount: userIds.length,
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
      param: userIds,
    };

    const usersData = await helper.runSQL(sql);

    if (!usersData || usersData.length === 0) {
      logger.warn('Tidak ada user dengan nomor telepon yang valid (Env Token)', {
        requestedUserCount: userIds.length,
      });
      return {
        success: false,
        message: 'Tidak ada user dengan nomor telepon yang valid',
        data: {
          requested: userIds.length,
          found: 0,
        },
        error: {
          message: 'No valid users found',
        },
        errorType: 'NO_USERS_FOUND',
      };
    }

    logger.info('Data users berhasil diambil (Env Token)', {
      requestedUserCount: userIds.length,
      foundUserCount: usersData.length,
    });

    const messages = usersData.map((user, index) => ({
      target: whatsapp.formatTargetWithVariable(user.nmr_tlpn, user.nama_lengkap),
      message: messageText,
      delay: options.delay ? (parseInt(options.delay) + index * 2).toString() : index.toString(),
    }));

    // Menggunakan token dari environment variable (idEvent = null)
    const result = await whatsapp.sendBulkMessages(null, messages);

    if (result.success) {
      result.data.usersSent = usersData.map(u => ({
        id: u.id_user,
        username: u.username,
        name: u.nama_lengkap,
      }));

      logger.info('Bulk notifikasi WhatsApp berhasil dikirim (Env Token)', {
        userCount: usersData.length,
        requestId: result.data?.requestid,
      });
    } else {
      logger.error('Gagal mengirim bulk notifikasi WhatsApp (Env Token)', {
        userCount: usersData.length,
        error: result.message,
        errorType: result.errorType,
      });
    }

    return result;
  } catch (error) {
    logger.error('Error sendNotificationToUsersWithEnv', {
      error: error.message,
      userCount: userIds?.length,
      stack: error.stack,
    });

    return {
      success: false,
      message: error.message,
      data: null,
      error: {
        message: error.message,
      },
      errorType: 'SYSTEM_ERROR',
    };
  }
};

/**
 * Endpoint untuk mengirim notifikasi ke single user dengan token dari environment variable
 * Method: POST
 * URL: /api/notification/whatsapp/send-to-user-with-env
 *
 * @param {number} user_id - ID User (wajib)
 * @param {string} message - Pesan (wajib)
 * @param {string} url - URL attachment
 * @param {number} schedule - Unix timestamp untuk jadwal
 * @param {string} delay - Delay pengiriman
 * @param {boolean} typing - Indikator mengetik
 *
 * @returns {Object} Response {success, message, data}
 *
 * Contoh Request Body:
 * {
 *   "user_id": 456,
 *   "message": "Halo user, ini notifikasi dengan token env",
 *   "typing": true
 * }
 */
Controller.sendToUserWithEnv = async (req, res) => {
  try {
    const { user_id, message, url, schedule, delay, typing } = req.body;

    if (isEmpty(user_id)) {
      return response.sc400('Parameter user_id wajib diisi', {}, res);
    }

    if (isEmpty(message)) {
      return response.sc400('Parameter message wajib diisi', {}, res);
    }

    const result = await Controller.sendNotificationToUserWithEnv(user_id, message, {
      url,
      schedule,
      delay,
      typing: typing !== undefined ? typing : true,
    });

    if (!result.success) {
      const statusCode =
        result.errorType === 'TOKEN_ERROR'
          ? 401
          : result.errorType === 'USER_NOT_FOUND'
          ? 404
          : 500;
      return response[`sc${statusCode}`](result.message, result.error || {}, res);
    }

    return response.sc200('Pesan WhatsApp berhasil dikirim ke user (Env Token)', result.data, res);
  } catch (error) {
    logger.error('Error di endpoint sendToUserWithEnv', {
      error: error.message,
    });
    return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
  }
};

/**
 * Endpoint untuk mengirim notifikasi ke multiple users dengan token dari environment variable
 * Method: POST
 * URL: /api/notification/whatsapp/send-to-users-with-env
 *
 * @param {Array} user_ids - Array of user IDs (wajib)
 * @param {string} message - Pesan (wajib)
 * @param {string} delay - Delay antar pengiriman
 * @param {string} url - URL attachment
 *
 * @returns {Object} Response {success, message, data}
 *
 * Contoh Request Body:
 * {
 *   "user_ids": [456, 789, 101],
 *   "message": "Halo semua user, ini broadcast message dengan token env",
 *   "delay": "1"
 * }
 */
Controller.sendToUsersWithEnv = async (req, res) => {
  try {
    const { user_ids, message, delay, url } = req.body;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return response.sc400(
        'Parameter user_ids harus berupa array dan tidak boleh kosong',
        {},
        res
      );
    }

    if (isEmpty(message)) {
      return response.sc400('Parameter message wajib diisi', {}, res);
    }

    const result = await Controller.sendNotificationToUsersWithEnv(user_ids, message, {
      delay,
      url,
    });

    if (!result.success) {
      const statusCode =
        result.errorType === 'TOKEN_ERROR'
          ? 401
          : result.errorType === 'NO_USERS_FOUND'
          ? 404
          : 500;
      return response[`sc${statusCode}`](result.message, result.error || {}, res);
    }

    return response.sc200(
      'Pesan WhatsApp berhasil dikirim ke multiple users (Env Token)',
      result.data,
      res
    );
  } catch (error) {
    logger.error('Error di endpoint sendToUsersWithEnv', {
      error: error.message,
    });
    return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi', {}, res);
  }
};

module.exports = Controller;
