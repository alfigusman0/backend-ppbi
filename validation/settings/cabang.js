/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.cabang = !isEmpty(data.cabang) ? data.cabang : '';
    data.ids_kabkota = !isEmpty(data.ids_kabkota) ? data.ids_kabkota : '';
    data.alamat = !isEmpty(data.alamat) ? data.alamat : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    // Validasi untuk method POST (Create)
    if (method === 'POST') {
        // Validasi field cabang (wajib diisi)
        if (Validator.isEmpty(data.cabang)) {
            errors.cabang = 'cabang tidak boleh kosong.';
        }

        // Validasi field ids_kabkota (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.ids_kabkota)) {
            errors.ids_kabkota = 'ids kabupaten/kota tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.ids_kabkota)) {
                errors.ids_kabkota = 'ids kabupaten/kota tidak valid.';
            }
        }

        // Validasi field alamat (wajib diisi)
        if (Validator.isEmpty(data.alamat)) {
            errors.alamat = 'alamat tidak boleh kosong.';
        }

        // Validasi field status (wajib diisi dan harus YA/TIDAK)
        if (Validator.isEmpty(data.status)) {
            errors.status = 'status tidak boleh kosong.';
        } else {
            if (!Validator.isIn(data.status, ['YA', 'TIDAK'])) {
                errors.status = 'status tidak valid.';
            }
        }
    } else {
        // Validasi untuk method lain (PUT/PATCH untuk Update)
        // Field bersifat opsional, tapi jika diisi harus valid

        // Validasi ids_kabkota jika diisi
        if (!Validator.isEmpty(data.ids_kabkota)) {
            if (!Validator.isInt(data.ids_kabkota)) {
                errors.ids_kabkota = 'ids kabupaten/kota tidak valid.';
            }
        }

        // Validasi status jika diisi
        if (!Validator.isEmpty(data.status)) {
            if (!Validator.isIn(data.status, ['YA', 'TIDAK'])) {
                errors.status = 'status tidak valid.';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};