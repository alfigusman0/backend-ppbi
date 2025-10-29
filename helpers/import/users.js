/* Config */
const encrypt = require('../../config/encrypt');
const moment = require('moment-timezone');
/* Libraries */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

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

  if (!Array.isArray(validatedData) || validatedData.length === 0) {
    return { errors: ['Data tidak valid untuk diproses'], data: [] };
  }

  validatedData.forEach(row => {
    if (usernameMap.has(row.row_number)) {
      errors.push(`Baris ${row.row_number}: Username "${row.username}" duplikasi di file import.`);
    } else {
      usernameMap.set(row.row_number, row.username);
    }
  });

  if (errors.length > 0) {
    return { errors, data: [] };
  }

  const usernames = validatedData.map(d => d.username);
  const existingUsers = await helper.runSQL({
    sql: `SELECT id_user, username FROM tbl_users WHERE username IN (${usernames
      .map(() => '?')
      .join(',')})`,
    param: usernames,
  });

  for (const user of existingUsers) {
    const rowNumber = [...usernameMap.entries()].find(([key, value]) => value === user.username)[0];
    errors.push(
      `Baris ${rowNumber}: Username "${user.username}" sudah ada di database (ID: ${user.id_user})`
    );
  }

  const filteredData = validatedData.filter(
    row => !errors.some(e => e.includes(`Baris ${row.row_number}`))
  );

  return { errors, data: filteredData };
};

/**
 * Validasi referensi foreign key
 * @param {Array} dataToImport - Data yang akan diimport
 * @param {Object} helper - Helper untuk runSQL
 * @returns {Array} - Array berisi error jika ada referensi yang invalid
 */
UsersImportService.validateForeignKeys = async (dataToImport, helper) => {
  const errors = [];

  if (!Array.isArray(dataToImport) || dataToImport.length === 0) {
    return errors;
  }

  const grupsToCheck = new Set();
  const kelurahansToCheck = new Set();
  const cabangToCheck = new Set();

  dataToImport.forEach(row => {
    if (row.ids_grup !== null && row.ids_grup !== undefined) grupsToCheck.add(row.ids_grup);
    if (row.ids_kelurahan !== null && row.ids_kelurahan !== undefined)
      kelurahansToCheck.add(row.ids_kelurahan);
    if (row.ids_cabang !== null && row.ids_cabang !== undefined) cabangToCheck.add(row.ids_cabang);
  });

  try {
    if (grupsToCheck.size > 0) {
      const grupIds = Array.from(grupsToCheck);
      const validGroups = await helper.runSQL({
        sql: `SELECT ids_grup FROM tbs_grup WHERE ids_grup IN (${grupIds
          .map(() => '?')
          .join(',')})`,
        param: grupIds,
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
    }

    if (kelurahansToCheck.size > 0) {
      const kelurahanIds = Array.from(kelurahansToCheck);
      const validKelurahan = await helper.runSQL({
        sql: `SELECT ids_kelurahan FROM tbs_kelurahan WHERE ids_kelurahan IN (${kelurahanIds
          .map(() => '?')
          .join(',')})`,
        param: kelurahanIds,
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
    }

    if (cabangToCheck.size > 0) {
      const cabangIds = Array.from(cabangToCheck);
      const validCabang = await helper.runSQL({
        sql: `SELECT ids_cabang FROM tbs_cabang WHERE ids_cabang IN (${cabangIds
          .map(() => '?')
          .join(',')})`,
        param: cabangIds,
      });
      const validCabangIds = validCabang.map(c => c.ids_cabang);
      cabangToCheck.forEach(cabangId => {
        if (!validCabangIds.includes(cabangId)) {
          dataToImport.forEach(row => {
            if (row.ids_cabang === cabangId) {
              errors.push(`Baris ${row.row_number}: ID Cabang ${cabangId} tidak ditemukan`);
            }
          });
        }
      });
    }
  } catch (dbError) {
    logger.error('Error validating foreign keys:', dbError);
    errors.push('Terjadi kesalahan pada validasi referensi data.');
  }

  return errors;
};

/**
 * Import data ke database (tanpa fleksibilitas import ulang)
 * @param {Array} dataToImport - Data yang siap diimport
 * @param {number} createdBy - ID user yang melakukan import
 * @param {Object} helper - Helper untuk runSQL
 * @returns {Object} - Status import dan result
 */
UsersImportService.importDataToDatabase = async (dataToImport, createdBy, helper) => {
  const results = { successCount: 0, failureCount: 0, details: [] };

  for (const row of dataToImport) {
    try {
      const hashedPassword = await encrypt.Hash(row.password);
      const userResult = await helper.runSQL({
        sql: "INSERT INTO tbl_users (ids_grup, username, password, reset, created_by) VALUES (?, ?, ?, 'TIDAK', ?)",
        param: [row.ids_grup || null, row.username, hashedPassword, createdBy],
      });
      const userId = userResult.insertId;
      if (!userId) throw new Error('Gagal membuat user baru');

      const profileResult = await helper.runSQL({
        sql: 'INSERT INTO tbl_profile (nama_lengkap, jenis_kelamin, ids_kelurahan, rw, rt, alamat, nmr_tlpn, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        param: [
          row.nama_lengkap,
          row.jenis_kelamin,
          row.ids_kelurahan || null,
          row.rw || null,
          row.rt || null,
          row.alamat || null,
          row.nmr_tlpn || null,
          userId,
        ],
      });
      const profileId = profileResult.insertId;
      if (!profileId) throw new Error('Gagal membuat profile baru');

      const masaBerlaku = row.masa_berlaku
        ? moment(row.masa_berlaku, ['YYYY-MM-DD', 'DD/MM/YYYY']).format('YYYY-MM-DD')
        : null;

      await helper.runSQL({
        sql: 'INSERT INTO tbl_kta (no_kta, kta_lama, id_profile, masa_berlaku, ids_cabang, bukti_bayar, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        param: [
          row.no_kta || null,
          row.kta_lama || null,
          profileId,
          masaBerlaku,
          row.ids_cabang || null,
          row.bukti_bayar || null,
          row.status_kta || 'MENUNGGU',
          createdBy,
        ],
      });

      results.successCount++;
      results.details.push({
        row_number: row.row_number,
        username: row.username,
        status: 'success',
        message: 'Data berhasil diimport',
      });
    } catch (error) {
      results.failureCount++;
      results.details.push({
        row_number: row.row_number,
        username: row.username,
        status: 'failed',
        message: error.message || 'Terjadi kesalahan saat import',
      });
    }
  }

  return results;
};

module.exports = UsersImportService;
