/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.id_formulir = !isEmpty(data.id_formulir) ? data.id_formulir : '';
    data.id_juara = !isEmpty(data.id_juara) ? data.id_juara : '';

    // Validasi untuk method POST (Create)
    if (method === 'POST') {
        // Validasi field id_formulir (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.id_formulir)) {
            errors.id_formulir = 'id formulir tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.id_formulir)) {
                errors.id_formulir = 'id formulir tidak valid.';
            }
        }

        // Validasi field id_juara (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.id_juara)) {
            errors.id_juara = 'id juara tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.id_juara)) {
                errors.id_juara = 'id juara tidak valid.';
            }
        }
    } else {
        // Validasi untuk method lain (PUT/PATCH untuk Update)
        // Field bersifat opsional, tapi jika diisi harus valid

        // Validasi id_formulir jika diisi
        if (!Validator.isEmpty(data.id_formulir)) {
            if (!Validator.isInt(data.id_formulir)) {
                errors.id_formulir = 'id formulir tidak valid.';
            }
        }

        // Validasi id_juara jika diisi
        if (!Validator.isEmpty(data.id_juara)) {
            if (!Validator.isInt(data.id_juara)) {
                errors.id_juara = 'id juara tidak valid.';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};