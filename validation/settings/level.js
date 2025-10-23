/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.level = !isEmpty(data.level) ? data.level : '';
    data.tingkat = !isEmpty(data.tingkat) ? data.tingkat : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    // Validasi untuk method POST (Create)
    if (method === 'POST') {
        // Validasi field level (wajib diisi dan max 255 karakter)
        if (Validator.isEmpty(data.level)) {
            errors.level = 'level tidak boleh kosong.';
        } else {
            if (!Validator.isLength(data.level, {
                    min: 1,
                    max: 255
                })) {
                errors.level = 'level maksimal 255 karakter.';
            }
        }

        // Validasi field tingkat (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.tingkat)) {
            errors.tingkat = 'tingkat tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.tingkat)) {
                errors.tingkat = 'tingkat tidak valid.';
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

        // Validasi level jika diisi
        if (!Validator.isEmpty(data.level)) {
            if (!Validator.isLength(data.level, {
                    min: 1,
                    max: 255
                })) {
                errors.level = 'level maksimal 255 karakter.';
            }
        }

        // Validasi tingkat jika diisi
        if (!Validator.isEmpty(data.tingkat)) {
            if (!Validator.isInt(data.tingkat)) {
                errors.tingkat = 'tingkat tidak valid.';
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