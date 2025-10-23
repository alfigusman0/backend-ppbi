/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.jenis_bonsai = !isEmpty(data.jenis_bonsai) ? data.jenis_bonsai : '';
    data.nama_latin = !isEmpty(data.nama_latin) ? data.nama_latin : '';
    data.jenis = !isEmpty(data.jenis) ? data.jenis : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    // Validasi untuk method POST (Create)
    if (method === 'POST') {
        // Validasi field jenis_bonsai (wajib diisi)
        if (Validator.isEmpty(data.jenis_bonsai)) {
            errors.jenis_bonsai = 'jenis bonsai tidak boleh kosong.';
        }

        // Validasi field nama_latin (opsional untuk POST, tapi jika diisi tetap valid)
        // Tidak ada validasi khusus karena field ini bisa NULL di database

        // Validasi field jenis (wajib diisi dan harus enum 'Bonsai' atau 'Suiseki')
        if (Validator.isEmpty(data.jenis)) {
            errors.jenis = 'jenis tidak boleh kosong.';
        } else {
            if (!Validator.isIn(data.jenis, ['Bonsai', 'Suiseki'])) {
                errors.jenis = 'jenis tidak valid. harus Bonsai atau Suiseki.';
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

        // Validasi jenis jika diisi
        if (!Validator.isEmpty(data.jenis)) {
            if (!Validator.isIn(data.jenis, ['Bonsai', 'Suiseki'])) {
                errors.jenis = 'jenis tidak valid. harus Bonsai atau Suiseki.';
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