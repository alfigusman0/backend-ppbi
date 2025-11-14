/* Libraries */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
/* Helpers */
const helper = require('../../helpers/helper');
const response = require('../../helpers/response');
const PenilaianImportService = require('../../helpers/import/penilaian');
const isEmpty = require('../../validation/is-empty');
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

// Helper function to check access rights
const checkAccess = async (req, action) => {
  const sql = {
    sql: 'SELECT * FROM tbs_hak_akses WHERE ids_level = ? AND ids_modul = ? AND permission LIKE ?',
    param: [req.authIdsLevel, 28, `%${action}%`],
  };
  console.log(sql);
  const result = await helper.runSQL(sql);
  return result.length > 0;
};

// Helper function to handle errors
const handleError = (error, res) => {
  logger.error(error);
  return response.sc500('An error occurred in the system, please try again.', {}, res);
};

Controller.preview = async (req, res) => {
  let uploadedFile = null;
  try {
    const hasAccess = await checkAccess(req, 'import');
    if (!hasAccess) {
      return response.sc401('Access denied.', {}, res);
    }

    const data = await PenilaianImportService.preview(req);

    return response.sc200('Preview file Excel berhasil.', data, res);
  } catch (error) {
    return handleError(error, res);
  } finally {
    if (uploadedFile && fs.existsSync(uploadedFile)) {
      fs.unlink(uploadedFile, err => {
        if (err) logger.error('Error deleting uploaded file:', err);
      });
    }
  }
};

Controller.process = async (req, res) => {
  let uploadedFile = null;
  try {
    const hasAccess = await checkAccess(req, 'import');
    if (!hasAccess) {
      return response.sc401('Access denied.', {}, res);
    }

    const data = await PenilaianImportService.process(req);

    return response.sc200('Import data berhasil', data, res);
  } catch (error) {
    return handleError(error, res);
  } finally {
    if (uploadedFile && fs.existsSync(uploadedFile)) {
      fs.unlink(uploadedFile, err => {
        if (err) logger.error('Error deleting uploaded file:', err);
      });
    }
  }
};

Controller.template = async (req, res) => {
  let templatePath = null;
  try {
    const { id_event } = req.query;
    if (isEmpty(id_event)) {
      return response.sc400('id_event harus diisi', {}, res);
    }

    // Dapatkan daftar juri untuk event ini
    const daftarJuri = await helper.runSQL({
      sql: `
        SELECT
          j.id_profile,
          p.nama_lengkap
        FROM tbl_juri j
        INNER JOIN tbl_profile p ON j.id_profile = p.id_profile
        WHERE j.id_event = ?
      `,
      param: [id_event],
    });

    // Prepare data untuk template
    const headers = [
      'no_juri',
      'id_profile_juri',
      'penampilan',
      'gerak_dasar',
      'keserasian/keselarasan',
      'kematangan',
      'tahapan',
    ];

    const templateData = [
      headers,
      ['JURI001', '', 85.5, 90.0, 87.5, 92.0, 1], // Contoh tanpa id_profile_juri (akan dibuat untuk semua juri)
      ['JURI002', daftarJuri[0]?.id_profile || '', 80.0, 85.5, 82.0, 88.5, 2], // Contoh dengan id_profile_juri spesifik
      ['JURI003', '', 0, 0, 0, 0, null], // Contoh dengan nilai default
    ];

    // Buat worksheet dari array data
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Setup kolom width
    const columnWidths = [15, 20, 15, 15, 25, 15, 15];
    worksheet['!cols'] = columnWidths.map(width => ({
      wch: width,
    }));

    // Tambahkan note tentang aturan
    const note = [
      ['CATATAN:'],
      ['- no_juri: wajib diisi, harus sesuai dengan no_juri di formulir'],
      ['- id_profile_juri: OPSIONAL, jika diisi maka penilaian hanya untuk juri tersebut'],
      ['- id_profile_juri: jika dikosongkan maka penilaian akan dibuat untuk SEMUA juri di event'],
      [
        '- penampilan, gerak_dasar, keserasian/keselarasan, kematangan: jika tidak diisi, default nilai 0',
      ],
      ['- tahapan: diisi 1-3, jika tidak diisi default null'],
      ['- Pastikan no_juri sudah terdaftar di formulir untuk event ini'],
      [''],
      ['DAFTAR JURI YANG TERSEDIA:'],
      ['id_profile', 'Nama Juri'],
      ...daftarJuri.map(j => [j.id_profile, j.nama_lengkap]),
    ];

    const noteWorksheet = XLSX.utils.aoa_to_sheet(note);

    // Buat workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Penilaian');
    XLSX.utils.book_append_sheet(workbook, noteWorksheet, 'Petunjuk & Daftar Juri');

    // Persiapan response
    const fileName = `Template_Import_Penilaian_${id_event}_${Date.now()}.xlsx`;
    const filePath = path.join('uploads', fileName);

    // Pastikan folder exists
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads', {
        recursive: true,
      });
    }

    // Write file
    XLSX.writeFile(workbook, filePath);
    templatePath = filePath;

    // Send file
    res.download(filePath, `Template_Import_Penilaian_${id_event}.xlsx`, err => {
      if (err) {
        logger.error('Error downloading file:', err);
      }
      // Hapus file setelah download
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, unlinkErr => {
          if (unlinkErr) logger.error('Error deleting template file:', unlinkErr);
        });
      }
    });

    logger.info(
      `Template Excel penilaian downloaded by user ${req.authIdUser} for event ${id_event}`
    );
  } catch (error) {
    return handleError(error, res);
  } finally {
    // Cleanup jika ada error sebelum download
    if (templatePath && fs.existsSync(templatePath)) {
      fs.unlink(templatePath, err => {
        if (err) logger.error('Error deleting template file:', err);
      });
    }
  }
};

module.exports = Controller;
