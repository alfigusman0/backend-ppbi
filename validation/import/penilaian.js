const Validator = require('validator');
const isEmpty = require('../is-empty');

const Validation = {};

Validation.preview = (req, res, next) => {
  let errors = {};
  const { id_event } = req.body;

  // Validasi id_event
  if (isEmpty(id_event)) {
    errors.id_event = 'ID Event harus dipilih';
  } else if (!Validator.isInt(String(id_event), { min: 1 })) {
    errors.id_event = 'ID Event harus berupa angka positif';
  }

  // Validasi file - middleware sudah menangani, jadi kita hanya cek keberadaan file
  if (!req.file) {
    errors.file = 'File Excel harus diupload';
  } else {
    // Validasi ekstensi file
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = req.file.originalname.toLowerCase().slice(-5);
    const isValidExtension = allowedExtensions.some(ext => fileExtension.endsWith(ext));

    if (!isValidExtension) {
      errors.file = 'File harus berekstensi .xlsx atau .xls';
    }

    // Validasi MIME type
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      errors.file = 'Tipe file tidak didukung. Harus file Excel.';
    }
  }

  if (!isEmpty(errors)) {
    return res.status(400).json({
      code: 400,
      status: 'error',
      message: 'Validasi gagal',
      errors: errors,
    });
  }

  next();
};

Validation.process = (req, res, next) => {
  let errors = {};
  const { id_event } = req.body;

  // Validasi id_event
  if (isEmpty(id_event)) {
    errors.id_event = 'ID Event harus dipilih';
  } else if (!Validator.isInt(String(id_event), { min: 1 })) {
    errors.id_event = 'ID Event harus berupa angka positif';
  }

  // Validasi file - middleware sudah menangani, jadi kita hanya cek keberadaan file
  if (!req.file) {
    errors.file = 'File Excel harus diupload';
  } else {
    // Validasi ekstensi file
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = req.file.originalname.toLowerCase().slice(-5);
    const isValidExtension = allowedExtensions.some(ext => fileExtension.endsWith(ext));

    if (!isValidExtension) {
      errors.file = 'File harus berekstensi .xlsx atau .xls';
    }

    // Validasi MIME type
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      errors.file = 'Tipe file tidak didukung. Harus file Excel.';
    }
  }

  if (!isEmpty(errors)) {
    return res.status(400).json({
      code: 400,
      status: 'error',
      message: 'Validasi gagal',
      errors: errors,
    });
  }

  next();
};

module.exports = Validation;
