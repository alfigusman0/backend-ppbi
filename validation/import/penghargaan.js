const Validator = require('validator');
const isEmpty = require('../is-empty');

const Validation = {};

Validation.preview = (req, res, next) => {
  let errors = {};
  const { id_juara } = req.body;

  // Validasi id_juara
  if (isEmpty(id_juara)) {
    errors.id_juara = 'ID Juara harus dipilih';
  } else if (!Validator.isInt(String(id_juara), { min: 1 })) {
    errors.id_juara = 'ID Juara harus berupa angka positif';
  }

  // Validasi file - middleware sudah menangani, jadi kita hanya cek keberadaan file
  if (!req.file) {
    errors.file = 'File Excel harus diupload';
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
  const { id_juara } = req.body;

  // Validasi id_juara
  if (isEmpty(id_juara)) {
    errors.id_juara = 'ID Juara harus dipilih';
  } else if (!Validator.isInt(String(id_juara), { min: 1 })) {
    errors.id_juara = 'ID Juara harus berupa angka positif';
  }

  // Validasi file - middleware sudah menangani, jadi kita hanya cek keberadaan file
  if (!req.file) {
    errors.file = 'File Excel harus diupload';
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
