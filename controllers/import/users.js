/* Libraries */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/* Helpers */
const helper = require('../../helpers/helper');
const response = require('../../helpers/response');

/* Validation */
const validateImportExcelData = require('../../validation/import/users');

/* Service */
const UsersImportService = require('../../helpers/import/users');

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
const redisPrefix = process.env.REDIS_PREFIX + "users:";

/**
 * Import Excel ke Database
 * POST /api/users/import/excel
 */
Controller.importExcel = async (req, res) => {
    let uploadedFile = null;

    try {
        // Check access
        const sql = {
            sql: "SELECT * FROM tbs_hak_akses WHERE ids_level = ? AND ids_modul = ? AND permission LIKE ?",
            param: [req.authIdsLevel, 2, '%create%']
        };
        const hasAccess = (await helper.runSQL(sql)).length > 0;

        if (!hasAccess) {
            return response.sc401("Akses ditolak.", {}, res);
        }

        // Validasi file upload
        if (!req.file) {
            return response.sc400("File tidak ditemukan.", {}, res);
        }

        uploadedFile = req.file.path;

        // Baca file Excel menggunakan SheetJS
        const workbook = XLSX.readFile(uploadedFile);
        const worksheetName = workbook.SheetNames[0];

        if (!worksheetName) {
            return response.sc400("Sheet tidak ditemukan dalam file Excel.", {}, res);
        }

        const worksheet = workbook.Sheets[worksheetName];

        // Convert sheet ke array dengan header
        const rows = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: ''
        });

        if (rows.length < 2) {
            return response.sc400("File Excel harus memiliki minimal header dan 1 baris data.", {}, res);
        }

        // Validasi struktur dan data
        const validation = validateImportExcelData(rows);
        if (!validation.isValid) {
            return response.sc400(
                "Data Excel tidak valid.", {
                    total_errors: validation.errors.length,
                    errors: validation.errors.slice(0, 10),
                    first_error: validation.errors[0]
                },
                res
            );
        }

        // Check duplikasi
        const {
            errors: duplicateErrors,
            validatedWithDuplicate
        } =
        await UsersImportService.checkDuplication(validation.validatedData, helper);

        if (duplicateErrors.length > 0) {
            return response.sc400(
                "Data duplikasi ditemukan.", {
                    total_errors: duplicateErrors.length,
                    errors: duplicateErrors.slice(0, 10)
                },
                res
            );
        }

        // Validasi foreign keys
        const foreignKeyErrors = await UsersImportService.validateForeignKeys(validatedWithDuplicate, helper);
        if (foreignKeyErrors.length > 0) {
            return response.sc400(
                "Referensi data tidak ditemukan.", {
                    total_errors: foreignKeyErrors.length,
                    errors: foreignKeyErrors.slice(0, 10)
                },
                res
            );
        }

        // Jika tidak ada data valid
        if (validatedWithDuplicate.length === 0) {
            return response.sc400("Tidak ada data yang valid untuk diimport.", {}, res);
        }

        // Import ke database
        const importResult = await UsersImportService.importDataToDatabase(
            validatedWithDuplicate,
            req.authIdUser,
            helper
        );

        // Hapus cache Redis
        try {
            await helper.deleteKeysByPattern(redisPrefix + '*');
        } catch (redisError) {
            logger.error('Failed to delete Redis cache:', redisError);
        }

        // Response
        const json = {
            summary: {
                total_rows: rows.length - 1,
                valid_rows: validation.validatedData.length,
                duplicate_rows: validation.validatedData.length - validatedWithDuplicate.length,
                import_success: importResult.successCount,
                import_failure: importResult.failureCount,
                success_rate: Math.round((importResult.successCount / validatedWithDuplicate.length) * 100) + '%'
            },
            details: importResult.details.slice(0, 50),
            timestamp: new Date().toISOString()
        };

        logger.info(`Import Excel completed: ${importResult.successCount} success, ${importResult.failureCount} failed by user ${req.authIdUser}`);

        return response.sc200(
            'Data berhasil diimport.',
            json,
            res
        );

    } catch (error) {
        logger.error('Error in importExcel:', error);
        return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi.', {}, res);

    } finally {
        // Hapus file upload
        if (uploadedFile && fs.existsSync(uploadedFile)) {
            fs.unlink(uploadedFile, (err) => {
                if (err) logger.error('Error deleting uploaded file:', err);
            });
        }
    }
};

/**
 * Preview Excel sebelum import
 * POST /api/users/import/preview
 */
Controller.previewExcel = async (req, res) => {
    let uploadedFile = null;

    try {
        // Check access
        const sql = {
            sql: "SELECT * FROM tbs_hak_akses WHERE ids_level = ? AND ids_modul = ? AND permission LIKE ?",
            param: [req.authIdsLevel, 2, '%read%']
        };
        const hasAccess = (await helper.runSQL(sql)).length > 0;

        if (!hasAccess) {
            return response.sc401("Akses ditolak.", {}, res);
        }

        if (!req.file) {
            return response.sc400("File tidak ditemukan.", {}, res);
        }

        uploadedFile = req.file.path;

        // Baca file Excel menggunakan SheetJS
        const workbook = XLSX.readFile(uploadedFile);
        const worksheetName = workbook.SheetNames[0];

        if (!worksheetName) {
            return response.sc400("Sheet pertama tidak ditemukan.", {}, res);
        }

        const worksheet = workbook.Sheets[worksheetName];
        
        // PENTING: Jangan gunakan { header: 1 } agar bisa debug header dengan mudah
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        logger.info(`Excel file read: ${worksheetName}, total rows: ${rows.length}`);
        logger.debug('First row (header):', rows[0]);

        if (rows.length < 2) {
            return response.sc400("File Excel harus memiliki minimal header dan 1 baris data.", {}, res);
        }

        // Validasi struktur
        const validation = validateImportExcelData(rows);

        // Jika ada error column mapping, tampilkan lebih detail
        if (!validation.isValid && validation.errors.some(e => e.includes('Kolom wajib'))) {
            logger.warn('Column mapping failed:', {
                headerRow: validation.headerRow,
                normalizedHeader: validation.detectedHeaders,
                columnMapping: validation.columnMapping,
                errors: validation.errors
            });

            // Format response lebih detail untuk membantu debugging
            const detailedMapping = {
                detected_columns: validation.detectedHeaders,
                found_mapping: Object.entries(validation.columnMapping)
                    .reduce((acc, [key, val]) => {
                        acc[key] = {
                            column_index: val,
                            column_name: validation.headerRow[val]
                        };
                        return acc;
                    }, {}),
                missing_columns: ['jenis_kelamin', 'ids_grup', 'ids_kelurahan', 'nmr_tlpn'].filter(
                    col => validation.columnMapping[col] === undefined
                )
            };

            return response.sc400(
                "Struktur kolom Excel tidak sesuai. Pastikan semua kolom wajib ada.",
                { 
                    expected_columns: ['Username', 'Password', 'Nama Lengkap', 'Jenis Kelamin', 'ID Grup', 'ID Kelurahan', 'RW', 'RT', 'Alamat', 'No. Telepon'],
                    found_columns: validation.headerRow || [],
                    detailed_mapping: detailedMapping,
                    errors: validation.errors
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
            validation_message: idx > 0 ? (
                validation.errors.find(e => e.startsWith(`Baris ${idx + 1}:`))?.replace(`Baris ${idx + 1}: `, '') || null
            ) : null
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
                ready_to_import: validation.isValid && duplicateErrors.length === 0 && validation.validatedData.length > 0
            },
            column_mapping: {
                mapped: validation.columnMapping,
                optional_columns: {
                    ids_grup: validation.columnMapping['ids_grup'] !== undefined,
                    ids_kelurahan: validation.columnMapping['ids_kelurahan'] !== undefined,
                    rw: validation.columnMapping['rw'] !== undefined,
                    rt: validation.columnMapping['rt'] !== undefined,
                    nmr_tlpn: validation.columnMapping['nmr_tlpn'] !== undefined,
                    alamat: validation.columnMapping['alamat'] !== undefined
                }
            },
            preview_data: previewRows,
            validation_summary: {
                is_valid: validation.isValid && duplicateErrors.length === 0,
                structure_valid: validation.isValid,
                no_duplicates: duplicateErrors.length === 0,
                has_valid_data: validation.validatedData.length > 0
            },
            errors: {
                structure_errors: validation.errors.slice(0, 10),
                duplicate_errors: duplicateErrors.slice(0, 10),
                total_structure_errors: validation.errors.length,
                total_duplicate_errors: duplicateErrors.length
            }
        };

        logger.info(`Preview Excel completed for user ${req.authIdUser}. Valid rows: ${validation.validatedData.length}`);

        return response.sc200('Preview file Excel berhasil.', json, res);

    } catch (error) {
        logger.error('Error in previewExcel:', error);
        return response.sc500('Terjadi kesalahan pada sistem, silakan coba lagi.', {}, res);

    } finally {
        if (uploadedFile && fs.existsSync(uploadedFile)) {
            fs.unlink(uploadedFile, (err) => {
                if (err) logger.error('Error deleting uploaded file:', err);
            });
        }
    }
};

/**
 * Download template Excel
 * GET /api/users/import/download-template
 */
Controller.downloadTemplate = async (req, res) => {
    try {
        // Prepare data untuk template
        const headers = [
            'Username', 'Password', 'Nama Lengkap', 'Jenis Kelamin',
            'ID Grup', 'ID Kelurahan', 'RW', 'RT', 'Alamat', 'No. Telepon'
        ];

        const templateData = [
            headers,
            ['budi.santoso', 'Password@123', 'Budi Santoso', 'LAKI-LAKI', 1, 5, '02', '03', 'Jl. Merdeka No. 1, Kota', '081234567890'],
            ['siti.nurhaliza', 'Password@456', 'Siti Nurhaliza', 'PEREMPUAN', 2, 5, '03', '05', 'Jl. Sudirman No. 10, Kota', '082345678901'],
            ['ahmad.wijaya', 'Password@789', 'Ahmad Wijaya', 'LAKI-LAKI', 1, 6, '01', '02', 'Jl. Gatot Subroto No. 5, Kota', '083456789012']
        ];

        // Buat worksheet dari array data
        const worksheet = XLSX.utils.aoa_to_sheet(templateData);

        // Setup kolom width
        const columnWidths = [20, 20, 30, 15, 12, 15, 8, 8, 40, 15];
        worksheet['!cols'] = columnWidths.map(width => ({
            wch: width
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
                recursive: true
            });
        }

        // Write file
        XLSX.writeFile(workbook, filePath);

        // Send file
        res.download(filePath, 'Template_Import_Users.xlsx', (err) => {
            if (err) {
                logger.error('Error downloading file:', err);
            }
            // Hapus file setelah download
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) logger.error('Error deleting template file:', unlinkErr);
            });
        });

        logger.info(`Template Excel downloaded by user ${req.authIdUser}`);

    } catch (error) {
        logger.error('Error in downloadTemplate:', error);
        return response.sc500('Terjadi kesalahan saat download template.', {}, res);
    }
};

module.exports = Controller;