/* Libraries */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Pastikan folder uploads/imports/ ada
const uploadsDir = 'uploads/imports';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, {
        recursive: true
    });
}

// Konfigurasi storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter file
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
        return cb(new Error('Format file harus .xlsx atau .xls'), false);
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        return cb(new Error('Ukuran file maksimal 5MB'), false);
    }

    cb(null, true);
};

module.exports = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});