/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.id_event = !isEmpty(data.id_event) ? data.id_event : '';
    data.id_profile = !isEmpty(data.id_profile) ? data.id_profile : '';
    data.penilaian = !isEmpty(data.penilaian) ? data.penilaian : '';

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

        // Validasi field id_profile (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.id_profile)) {
            errors.id_profile = 'id profile tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.id_profile)) {
                errors.id_profile = 'id profile tidak valid.';
            }
        }

        // Validasi field penilaian (wajib diisi dan harus enum 'BELUM' atau 'SUDAH')
        if (Validator.isEmpty(data.penilaian)) {
            errors.penilaian = 'penilaian tidak boleh kosong.';
        } else {
            if (!Validator.isIn(data.penilaian, ['BELUM', 'SUDAH'])) {
                errors.penilaian = 'penilaian tidak valid. harus BELUM atau SUDAH.';
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

        // Validasi id_profile jika diisi
        if (!Validator.isEmpty(data.id_profile)) {
            if (!Validator.isInt(data.id_profile)) {
                errors.id_profile = 'id profile tidak valid.';
            }
        }

        // Validasi penilaian jika diisi
        if (!Validator.isEmpty(data.penilaian)) {
            if (!Validator.isIn(data.penilaian, ['BELUM', 'SUDAH'])) {
                errors.penilaian = 'penilaian tidak valid. harus BELUM atau SUDAH.';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};