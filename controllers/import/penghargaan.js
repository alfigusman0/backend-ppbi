/* Libraries */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
/* Helpers */
const helper = require('../../helpers/helper');
const response = require('../../helpers/response');
const PenghargaanImportService = require('../../helpers/import/penghargaan');
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
    param: [req.authIdsLevel, 27, `%${action}%`],
  };
  const result = await helper.runSQL(sql);
  return result.length > 0;
};

// Helper function to handle errors
const handleError = (error, res) => {
  console.error(error);
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

    const data = await PenghargaanImportService.preview(req);

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

    const data = await PenghargaanImportService.process(req);

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
  try {
    // Prepare data untuk template
    const headers = ['no_juri', 'jenis_bonsai', 'nama_kategori', 'nama_kelas'];

    const templateData = [
      headers,
      ['REG001', 'Juniper (optional)', 'Bahan (optional)', 'A1 (optional)'],
      ['REG002', 'Panorama (optional)', 'Panorama (optional)', 'D1 (optional)'],
    ];

    // Buat worksheet dari array data
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Setup kolom width
    const columnWidths = [20, 25, 20, 15];
    worksheet['!cols'] = columnWidths.map(width => ({
      wch: width,
    }));

    // Buat workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Penghargaan');

    // Persiapan response
    const fileName = 'Template_Import_Penghargaan_' + Date.now() + '.xlsx';
    const filePath = path.join('uploads', fileName);

    // Pastikan folder exists
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads', {
        recursive: true,
      });
    }

    // Write file
    XLSX.writeFile(workbook, filePath);

    // Send file
    res.download(filePath, 'Template_Import_Penghargaan.xlsx', err => {
      if (err) {
        logger.error('Error downloading file:', err);
      }
      // Hapus file setelah download
      fs.unlink(filePath, unlinkErr => {
        if (unlinkErr) logger.error('Error deleting template file:', unlinkErr);
      });
    });

    logger.info(`Template Excel downloaded by user ${req.authIdUser}`);
  } catch (error) {
    return handleError(error, res);
  }
};

module.exports = Controller;
