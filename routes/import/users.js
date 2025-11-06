/* Libraries */
const router = require('express').Router();

/* Controller */
const Controller = require('../../controllers/import/users');

/* Middleware */
const isAuth = require('../../middleware/isAuth');
const upload = require('../../middleware/import.js');

/**
 * POST /api/users/import/excel
 * Import data dari Excel file ke database
 * @body file (multipart/form-data) - Excel file (.xlsx/.xls)
 * @returns {Object} Import result dengan summary dan detail
 */
router.post('/excel', isAuth, upload.single('file'), Controller.importExcel);

/**
 * POST /api/users/import/preview
 * Preview data dari Excel file sebelum import
 * @body file (multipart/form-data) - Excel file (.xlsx/.xls)
 * @returns {Object} Preview data dengan validasi errors
 */
router.post('/preview', isAuth, upload.single('file'), Controller.previewExcel);

/**
 * GET /api/users/import/download-template
 * Download template Excel untuk import users
 * @returns {File} Excel template file
 */
router.get('/download-template', Controller.downloadTemplate);

module.exports = router;
