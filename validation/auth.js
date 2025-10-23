/* Libraries */
const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateInput(method, path, data) {
  let errors = {};

  // Normalisasi data - konversi ke string kosong jika undefined/null
  data.username = !isEmpty(data.username) ? data.username : '';
  data.password = !isEmpty(data.password) ? data.password : '';
  data.confirm_password = !isEmpty(data.confirm_password) ? data.confirm_password : '';
  data.reset = !isEmpty(data.reset) ? data.reset : '';

  // Validasi untuk method POST
  if (method === 'POST') {
    // === VALIDASI PATH /REGISTER ===
    if (path === '/register') {
      // Validasi field username (wajib diisi dan 4-20 karakter)
      if (Validator.isEmpty(data.username)) {
        errors.username = 'username tidak boleh kosong.';
      } else {
        if (!Validator.isLength(data.username, {
            min: 4,
            max: 20
          })) {
          errors.username = 'username harus 4-20 karakter.';
        }
        // Validasi format username (hanya alphanumeric dan underscore)
        if (!/^[a-zA-Z0-9._]+$/.test(data.username)) {
          errors.username = 'username hanya boleh mengandung huruf, angka, underscore, dan titik.';
        }
      }

      // Validasi field password
      if (Validator.isEmpty(data.password)) {
        errors.password = 'password tidak boleh kosong.';
      } else {
        // Jika reset ≠ 'YA', lakukan validasi strong password
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
      }

      // Validasi field confirm_password
      if (Validator.isEmpty(data.confirm_password)) {
        errors.confirm_password = 'konfirmasi password tidak boleh kosong.';
      } else {
        if (!Validator.equals(data.password, data.confirm_password)) {
          errors.confirm_password = 'password dan konfirmasi password tidak cocok.';
        }
      }

      // Validasi field reset (opsional, tapi jika diisi harus enum)
      if (!Validator.isEmpty(data.reset)) {
        if (!Validator.isIn(data.reset, ['YA', 'TIDAK'])) {
          errors.reset = 'reset tidak valid. harus YA atau TIDAK.';
        }
      }
    }
    // === VALIDASI PATH /LOGIN ===
    else if (path === '/login') {
      // Validasi field username (wajib diisi)
      if (Validator.isEmpty(data.username)) {
        errors.username = 'username tidak boleh kosong.';
      }

      // Validasi field password (wajib diisi)
      if (Validator.isEmpty(data.password)) {
        errors.password = 'password tidak boleh kosong.';
      }
    }
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};