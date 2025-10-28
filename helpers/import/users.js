/* Config */
const encrypt = require('../../config/encrypt');

/* Libraries */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

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

const UsersImportService = {};

/**
 * Cek duplikasi data dan konflik dengan database
 * @param {Array} validatedData - Data yang sudah divalidasi
 * @param {Object} helper - Helper untuk runSQL
 * @returns {Object} - Object berisi errors dan data valid
 */
UsersImportService.checkDuplication = async (validatedData, helper) => {
    const errors = [];
    const usernameMap = new Map();
    const validatedWithDuplicate = [];

    // Check internal duplikasi dalam file
    validatedData.forEach((row) => {
        if (usernameMap.has(row.username)) {
            errors.push(`Baris ${row.row_number}: Username "${row.username}" duplikasi dengan baris ${usernameMap.get(row.row_number)}`);
        } else {
            usernameMap.set(row.username, row.row_number);
            validatedWithDuplicate.push(row);
        }
    });

    // Check duplikasi di database
    if (validatedWithDuplicate.length > 0) {
        const usernames = validatedWithDuplicate.map(d => d.username);

        try {
            const existingUsers = await helper.runSQL({
                sql: `SELECT username, id_user FROM tbl_users WHERE username IN (${usernames.map(() => '?').join(',')})`,
                param: usernames
            });

            existingUsers.forEach(user => {
                const rowNum = validatedWithDuplicate.find(d => d.username === user.username)?.row_number;
                errors.push(`Baris ${rowNum}: Username "${user.username}" sudah ada di database (ID: ${user.id_user})`);
            });
        } catch (dbError) {
            logger.error('Error checking database duplication:', dbError);
            errors.push('Gagal mengecek duplikasi dengan database');
        }
    }

    return {
        errors,
        validatedWithDuplicate
    };
};

/**
 * Validasi referensi foreign key
 * @param {Array} dataToImport - Data yang akan diimport
 * @param {Object} helper - Helper untuk runSQL
 * @returns {Array} - Array berisi error jika ada referensi yang invalid
 */
UsersImportService.validateForeignKeys = async (dataToImport, helper) => {
    const errors = [];
    const grupsToCheck = new Set();
    const kelurahansToCheck = new Set();

    // Kumpulkan semua grup dan kelurahan yang perlu dicek
    dataToImport.forEach(row => {
        if (row.ids_grup !== null) grupsToCheck.add(row.ids_grup);
        if (row.ids_kelurahan !== null) kelurahansToCheck.add(row.ids_kelurahan);
    });

    // Check grup validity
    if (grupsToCheck.size > 0) {
        try {
            const grupIds = Array.from(grupsToCheck);
            const validGroups = await helper.runSQL({
                sql: `SELECT ids_grup FROM tbs_grup WHERE ids_grup IN (${grupIds.map(() => '?').join(',')})`,
                param: grupIds
            });

            const validGrupIds = validGroups.map(g => g.ids_grup);
            grupsToCheck.forEach(grupId => {
                if (!validGrupIds.includes(grupId)) {
                    dataToImport.forEach(row => {
                        if (row.ids_grup === grupId) {
                            errors.push(`Baris ${row.row_number}: ID Grup ${grupId} tidak ditemukan`);
                        }
                    });
                }
            });
        } catch (dbError) {
            logger.error('Error validating groups:', dbError);
        }
    }

    // Check kelurahan validity
    if (kelurahansToCheck.size > 0) {
        try {
            const kelurahanIds = Array.from(kelurahansToCheck);
            const validKelurahan = await helper.runSQL({
                sql: `SELECT ids_kelurahan FROM tbs_kelurahan WHERE ids_kelurahan IN (${kelurahanIds.map(() => '?').join(',')})`,
                param: kelurahanIds
            });

            const validKelurahanIds = validKelurahan.map(k => k.ids_kelurahan);
            kelurahansToCheck.forEach(kelurahanId => {
                if (!validKelurahanIds.includes(kelurahanId)) {
                    dataToImport.forEach(row => {
                        if (row.ids_kelurahan === kelurahanId) {
                            errors.push(`Baris ${row.row_number}: ID Kelurahan ${kelurahanId} tidak ditemukan`);
                        }
                    });
                }
            });
        } catch (dbError) {
            logger.error('Error validating kelurahan:', dbError);
        }
    }

    return errors;
};

/**
 * Import data ke database
 * @param {Array} dataToImport - Data yang siap diimport
 * @param {number} createdBy - ID user yang melakukan import
 * @param {Object} helper - Helper untuk runSQL
 * @returns {Object} - Status import dan result
 */
UsersImportService.importDataToDatabase = async (dataToImport, createdBy, helper) => {
    const results = {
        successCount: 0,
        failureCount: 0,
        details: []
    };

    for (const row of dataToImport) {
        try {
            // Hash password menggunakan bcrypt
            const hashedPassword = await encrypt.Hash(row.password);

            // Insert ke tbl_users
            const userResult = await helper.runSQL({
                sql: `INSERT INTO tbl_users (
                    ids_grup, username, password, reset, created_by
                ) VALUES (?, ?, ?, 'TIDAK', ?)`,
                param: [
                    row.ids_grup || null,
                    row.username,
                    hashedPassword,
                    createdBy
                ]
            });

            const userId = userResult.insertId;

            if (!userId) {
                throw new Error('Gagal mendapatkan ID user yang baru dibuat');
            }

            // Insert ke tbl_profile
            // id_user dari tbl_users disimpan sebagai created_by di tbl_profile
            await helper.runSQL({
                sql: `INSERT INTO tbl_profile (
                    nama_lengkap, jenis_kelamin, ids_kelurahan, rw, rt,
                    alamat, nmr_tlpn, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                param: [
                    row.nama_lengkap,
                    row.jenis_kelamin,
                    row.ids_kelurahan || null,
                    row.rw || null,
                    row.rt || null,
                    row.alamat || null,
                    row.nmr_tlpn || null,
                    userId // ID user yang baru dibuat disimpan ke created_by di tbl_profile
                ]
            });

            results.successCount++;
            results.details.push({
                row_number: row.row_number,
                username: row.username,
                id_user: userId,
                status: 'berhasil',
                message: 'Data berhasil diimport'
            });

            logger.info(`User ${row.username} (ID: ${userId}) successfully imported`);

        } catch (error) {
            results.failureCount++;
            results.details.push({
                row_number: row.row_number,
                username: row.username,
                status: 'gagal',
                message: error.message || 'Terjadi kesalahan saat insert data'
            });
            logger.error(`Error importing row ${row.row_number} (${row.username}):`, error);
        }
    }

    return results;
};

module.exports = UsersImportService;