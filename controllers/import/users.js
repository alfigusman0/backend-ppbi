/* Libraries */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
/* Helpers */
const helper = require('../../helpers/helper');
const response = require('../../helpers/response');
const UsersImportService = require('../../helpers/import/users');
/* Validation */
const validateImportExcelData = require('../../validation/import/users');
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
    param: [req.authIdsLevel, 2, `%${action}%`],
  };
  const result = await helper.runSQL(sql);
  return result.length > 0;
};

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

    if (!req.file) {
      return response.sc400('File tidak ditemukan.', {}, res);
    }

    uploadedFile = req.file.path;

    // Baca file Excel menggunakan SheetJS
    const workbook = XLSX.readFile(uploadedFile);
    const worksheetName = workbook.SheetNames[0];

    if (!worksheetName) {
      return response.sc400('Sheet pertama tidak ditemukan.', {}, res);
    }

    const worksheet = workbook.Sheets[worksheetName];

    // PENTING: Jangan gunakan { header: 1 } agar bisa debug header dengan mudah
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    logger.info(`Excel file read: ${worksheetName}, total rows: ${rows.length}`);
    logger.debug('First row (header):', rows[0]);

    if (rows.length < 2) {
      return response.sc400('File Excel harus memiliki minimal header dan 1 baris data.', {}, res);
    }

    // Validasi struktur
    const validation = validateImportExcelData(rows);

    // Jika ada error column mapping, tampilkan lebih detail
    if (!validation.isValid && validation.errors.some(e => e.includes('Kolom wajib'))) {
      logger.warn('Column mapping failed:', {
        headerRow: validation.headerRow,
        normalizedHeader: validation.detectedHeaders,
        columnMapping: validation.columnMapping,
        errors: validation.errors,
      });

      // Format response lebih detail untuk membantu debugging
      const detailedMapping = {
        detected_columns: validation.detectedHeaders,
        found_mapping: Object.entries(validation.columnMapping).reduce((acc, [key, val]) => {
          acc[key] = {
            column_index: val,
            column_name: validation.headerRow[val],
          };
          return acc;
        }, {}),
        missing_columns: ['jenis_kelamin', 'ids_grup', 'ids_kelurahan', 'nmr_tlpn'].filter(
          col => validation.columnMapping[col] === undefined
        ),
      };

      return response.sc400(
        'Struktur kolom Excel tidak sesuai. Pastikan semua kolom wajib ada.',
        {
          expected_columns: [
            'Username',
            'Password',
            'Nama Lengkap',
            'Jenis Kelamin',
            'ID Grup',
            'ID Kelurahan',
            'RW',
            'RT',
            'Alamat',
            'No. Telepon',
          ],
          found_columns: validation.headerRow || [],
          detailed_mapping: detailedMapping,
          errors: validation.errors,
        },
        res
      );
    }

    // Check duplikasi
    const { errors: duplicateErrors, validatedWithDuplicate } =
      await UsersImportService.checkDuplication(validation.validatedData, helper);

    // Ambil preview (header + 5 baris pertama data)
    const previewRows = rows.slice(0, 6).map((row, idx) => ({
      row_number: idx + 1,
      data: row,
      is_header: idx === 0,
      validation_message:
        idx > 0
          ? validation.errors
              .find(e => e.startsWith(`Baris ${idx + 1}:`))
              ?.replace(`Baris ${idx + 1}: `, '') || null
          : null,
    }));

    // Hitung statistik
    const invalidRowCount = validation.errors.length;
    const duplicateRowCount = duplicateErrors.length;

    const json = {
      file_info: {
        total_rows: rows.length - 1,
        valid_rows: validation.validatedData.length,
        invalid_rows: invalidRowCount,
        duplicate_rows: duplicateRowCount,
        ready_to_import:
          validation.isValid && duplicateErrors.length === 0 && validation.validatedData.length > 0,
      },
      column_mapping: {
        mapped: validation.columnMapping,
        optional_columns: {
          ids_grup: validation.columnMapping['ids_grup'] !== undefined,
          ids_kelurahan: validation.columnMapping['ids_kelurahan'] !== undefined,
          rw: validation.columnMapping['rw'] !== undefined,
          rt: validation.columnMapping['rt'] !== undefined,
          nmr_tlpn: validation.columnMapping['nmr_tlpn'] !== undefined,
          alamat: validation.columnMapping['alamat'] !== undefined,
        },
      },
      preview_data: previewRows,
      validation_summary: {
        is_valid: validation.isValid && duplicateErrors.length === 0,
        structure_valid: validation.isValid,
        no_duplicates: duplicateErrors.length === 0,
        has_valid_data: validation.validatedData.length > 0,
      },
      errors: {
        structure_errors: validation.errors.slice(0, 10),
        duplicate_errors: duplicateErrors.slice(0, 10),
        total_structure_errors: validation.errors.length,
        total_duplicate_errors: duplicateErrors.length,
      },
    };

    logger.info(
      `Preview Excel completed for user ${req.authIdUser}. Valid rows: ${validation.validatedData.length}`
    );

    return response.sc200('Preview file Excel berhasil.', json, res);
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

    if (!req.file) {
      return response.sc400('File tidak ditemukan, silakan upload file Excel', {}, res);
    }

    uploadedFile = req.file.path;

    const workbook = XLSX.readFile(uploadedFile);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rows.length === 0) {
      return response.sc400('File Excel kosong', {}, res);
    }

    // Validasi struktur data
    const validation = validateImportExcelData(rows);
    if (!validation.isValid || validation.errors.length > 0) {
      return response.sc400(
        'Data tidak valid',
        { total_errors: validation.errors.length, errors: validation.errors },
        res
      );
    }

    const validatedData = validation.validatedData;

    // Cek duplikasi
    const dupCheck = await UsersImportService.checkDuplication(validatedData, helper);
    if (dupCheck.errors.length > 0) {
      return response.sc400(
        'Data duplikasi ditemukan.',
        { total_errors: dupCheck.errors.length, errors: dupCheck.errors },
        res
      );
    }

    const dataToImport = dupCheck.data;

    // Validasi foreign keys
    if (Array.isArray(dataToImport) && dataToImport.length > 0) {
      const fkErrors = await UsersImportService.validateForeignKeys(dataToImport, helper);
      if (fkErrors && fkErrors.length > 0) {
        return response.sc400(
          'Referensi data tidak ditemukan.',
          { total_errors: fkErrors.length, errors: fkErrors },
          res
        );
      }
    }

    // Import data ke database
    const createdBy = req.user ? req.user.id_user : 1;
    const importResult = await UsersImportService.importDataToDatabase(
      dataToImport,
      createdBy,
      helper
    );

    // Hapus file setelah selesai
    if (fs.existsSync(uploadedFile)) {
      fs.unlinkSync(uploadedFile);
    }

    return response.sc200(
      'Import data berhasil',
      {
        success: importResult.successCount,
        failed: importResult.failureCount,
        details: importResult.details,
      },
      res
    );
  } catch (error) {
    if (uploadedFile && fs.existsSync(uploadedFile)) {
      fs.unlinkSync(uploadedFile);
    }
    return handleError(error, res);
  }
};

Controller.template = async (req, res) => {
  try {
    // Prepare data untuk template
    const headers = [
      'Username',
      'Password',
      'Nama Lengkap',
      'Jenis Kelamin',
      'ID Grup',
      'ID Kelurahan',
      'RW',
      'RT',
      'Alamat',
      'No. Telepon',
      'No. KTA',
      'KTA Lama',
      'Masa Berlaku',
      'ID Cabang',
      'Bukti Bayar',
      'Status KTA',
    ];

    const templateData = [
      headers,
      [
        'budi.santoso',
        'Password@123',
        'Budi Santoso',
        'LAKI-LAKI',
        1,
        5,
        '02',
        '03',
        'Jl. Merdeka No. 1, Kota',
        '081234567890',
        'KTA2025-001',
        '-',
        '2026-12-31',
        4,
        '-',
        'MENUNGGU',
      ],
      [
        'siti.nurhaliza',
        'Password@456',
        'Siti Nurhaliza',
        'PEREMPUAN',
        2,
        5,
        '03',
        '05',
        'Jl. Sudirman No. 10, Kota',
        '082345678901',
        'KTA2025-002',
        'KTA2020-015',
        '2025-12-31',
        3,
        '-',
        'DIAJUKAN',
      ],
      [
        'ahmad.wijaya',
        'Password@789',
        'Ahmad Wijaya',
        'LAKI-LAKI',
        1,
        6,
        '01',
        '02',
        'Jl. Gatot Subroto No. 5, Kota',
        '083456789012',
        '',
        '',
        '',
        '',
        '',
        'MENUNGGU',
      ],
    ];

    // Buat worksheet dari array data
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Setup kolom width
    const columnWidths = [20, 20, 30, 15, 12, 15, 8, 8, 40, 15];
    worksheet['!cols'] = columnWidths.map(width => ({
      wch: width,
    }));

    // Buat workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Users');

    // Persiapan response
    const fileName = 'Template_Import_Users_' + Date.now() + '.xlsx';
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
    res.download(filePath, 'Template_Import_Users.xlsx', err => {
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
