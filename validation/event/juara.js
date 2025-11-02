/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
  let errors = {};

  // Normalisasi data - konversi ke string kosong jika undefined/null
  data.id_event = !isEmpty(data.id_event) ? data.id_event : '';
  data.nama_juara = !isEmpty(data.nama_juara) ? data.nama_juara : '';
  data.jumlah = !isEmpty(data.jumlah) ? data.jumlah : '';
  data.status = !isEmpty(data.status) ? data.status : '';

  // Validasi untuk method POST (Create)
  if (method === 'POST') {
    // Validasi field id_event (wajib diisi dan harus integer)
    if (Validator.isEmpty(data.id_event)) {
      errors.id_event = 'id event tidak boleh kosong.';
    } else {
      if (!Validator.isInt(data.id_event)) {
        errors.id_event = 'id event tidak valid.';
      }
    }

    // Validasi field nama_juara (wajib diisi dan max 100 karakter)
    if (Validator.isEmpty(data.nama_juara)) {
      errors.nama_juara = 'nama juara tidak boleh kosong.';
    } else {
      if (
        !Validator.isLength(data.nama_juara, {
          min: 1,
          max: 100,
        })
      ) {
        errors.nama_juara = 'nama juara maksimal 100 karakter.';
      }
    }

    // Validasi field jumlah (harus integer)
    if (!Validator.isEmpty(data.jumlah)) {
      if (!Validator.isInt(data.jumlah)) {
        errors.jumlah = 'jumlah tidak valid.';
      }
    }

    // Validasi field status (wajib diisi dan harus enum 'YA' atau 'TIDAK')
    if (Validator.isEmpty(data.status)) {
      errors.status = 'status tidak boleh kosong.';
    } else {
      if (!Validator.isIn(data.status, ['YA', 'TIDAK'])) {
        errors.status = 'status tidak valid. harus YA atau TIDAK.';
      }
    }
  } else {
    // Validasi untuk method lain (PUT/PATCH untuk Update)
    // Field bersifat opsional, tapi jika diisi harus valid

    // Validasi id_event jika diisi
    if (!Validator.isEmpty(data.id_event)) {
      if (!Validator.isInt(data.id_event)) {
        errors.id_event = 'id event tidak valid.';
      }
    }

    // Validasi nama_juara jika diisi
    if (!Validator.isEmpty(data.nama_juara)) {
      if (
        !Validator.isLength(data.nama_juara, {
          min: 1,
          max: 100,
        })
      ) {
        errors.nama_juara = 'nama juara maksimal 100 karakter.';
      }
    }

    // Validasi field jumlah (harus integer)
    if (!Validator.isEmpty(data.jumlah)) {
      if (!Validator.isInt(data.jumlah)) {
        errors.jumlah = 'jumlah tidak valid.';
      }
    }

    // Validasi status jika diisi
    if (!Validator.isEmpty(data.status)) {
      if (!Validator.isIn(data.status, ['YA', 'TIDAK'])) {
        errors.status = 'status tidak valid. harus YA atau TIDAK.';
      }
    }
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
