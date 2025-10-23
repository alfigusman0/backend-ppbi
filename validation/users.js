/* Libraries */
const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateInput(method, path, data) {
  let errors = {};

  // Normalisasi data
  data.ids_grup = !isEmpty(data.ids_grup) ? data.ids_grup : '';
  data.username = !isEmpty(data.username) ? data.username : '';
  data.password = !isEmpty(data.password) ? data.password : '';
  data.confirm_password = !isEmpty(data.confirm_password) ? data.confirm_password : '';
  data.reset = !isEmpty(data.reset) ? data.reset : '';

  // Validasi untuk method POST (Create)
  if (method === 'POST') {
    // Validasi field ids_grup (wajib diisi dan harus integer)
    if (Validator.isEmpty(data.ids_grup)) {
      errors.ids_grup = 'ids grup tidak boleh kosong.';
    } else {
      if (!Validator.isInt(data.ids_grup)) {
        errors.ids_grup = 'ids grup tidak valid.';
      }
    }

    // Validasi field username (wajib diisi dan harus 3-50 karakter)
    if (Validator.isEmpty(data.username)) {
      errors.username = 'username tidak boleh kosong.';
    } else {
      if (!Validator.isLength(data.username, {
          min: 3,
          max: 50
        })) {
        errors.username = 'username harus 3-50 karakter.';
      }
      // Validasi format username
      if (!/^[a-zA-Z0-9._]+$/.test(data.username)) {
        errors.username = 'username hanya boleh mengandung huruf, angka, underscore, dan titik.';
      }
    }

    // Validasi password - OPTIMIZED VERSION
    if (!Validator.isEmpty(data.password)) {
      if (data.reset !== 'YA') {
        if (!Validator.isStrongPassword(data.password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          })) {
          errors.password = 'password harus minimal 8 karakter dengan kombinasi huruf kecil, huruf besar, angka, dan simbol.';
        }
      }
    }

    // Validasi confirm_password
    if (!Validator.isEmpty(data.confirm_password)) {
      if (!Validator.equals(data.password, data.confirm_password)) {
        errors.confirm_password = 'password dan confirm password tidak cocok.';
      }
    }

    // Validasi field reset (wajib diisi dan harus enum)
    if (Validator.isEmpty(data.reset)) {
      errors.reset = 'reset tidak boleh kosong.';
    } else {
      if (!Validator.isIn(data.reset, ['TIDAK', 'YA'])) {
        errors.reset = 'reset tidak valid. harus TIDAK atau YA.';
      }
    }
  } else {
    // Validasi untuk method lain (PUT/PATCH untuk Update)

    // Validasi ids_grup jika diisi
    if (!Validator.isEmpty(data.ids_grup)) {
      if (!Validator.isInt(data.ids_grup)) {
        errors.ids_grup = 'ids grup tidak valid.';
      }
    }

    // Validasi username jika diisi
    if (!Validator.isEmpty(data.username)) {
      if (!Validator.isLength(data.username, {
          min: 3,
          max: 50
        })) {
        errors.username = 'username harus 3-50 karakter.';
      }
      if (!/^[a-zA-Z0-9._]+$/.test(data.username)) {
        errors.username = 'username hanya boleh mengandung huruf, angka, underscore, dan titik.';
      }
    }

    // Validasi password jika diisi - OPTIMIZED VERSION
    if (!Validator.isEmpty(data.password)) {
      if (data.reset !== 'YA') {
        if (!Validator.isStrongPassword(data.password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          })) {
          errors.password = 'password harus minimal 8 karakter dengan kombinasi huruf kecil, huruf besar, angka, dan simbol.';
        }
      }
    }

    // Validasi confirm_password jika diisi
    if (!Validator.isEmpty(data.confirm_password)) {
      if (!Validator.equals(data.password, data.confirm_password)) {
        errors.confirm_password = 'password dan confirm password tidak cocok.';
      }
    }

    // Validasi reset jika diisi
    if (!Validator.isEmpty(data.reset)) {
      if (!Validator.isIn(data.reset, ['TIDAK', 'YA'])) {
        errors.reset = 'reset tidak valid. harus TIDAK atau YA.';
      }
    }
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};