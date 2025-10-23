/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.kode_kabkota = !isEmpty(data.kode_kabkota) ? data.kode_kabkota : '';
    data.ids_provinsi = !isEmpty(data.ids_provinsi) ? data.ids_provinsi : '';
    data.kabkota = !isEmpty(data.kabkota) ? data.kabkota : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    // Validasi untuk method POST (Create)
    if (method === 'POST') {
        // Validasi field kode_kabkota (wajib diisi dan max 10 karakter)
        if (Validator.isEmpty(data.kode_kabkota)) {
            errors.kode_kabkota = 'kode kabupaten/kota tidak boleh kosong.';
        } else {
            if (!Validator.isLength(data.kode_kabkota, {
                    min: 1,
                    max: 10
                })) {
                errors.kode_kabkota = 'kode kabupaten/kota maksimal 10 karakter.';
            }
        }

        // Validasi field ids_provinsi (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.ids_provinsi)) {
            errors.ids_provinsi = 'ids provinsi tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.ids_provinsi)) {
                errors.ids_provinsi = 'ids provinsi tidak valid.';
            }
        }

        // Validasi field kabkota (wajib diisi)
        if (Validator.isEmpty(data.kabkota)) {
            errors.kabkota = 'nama kabupaten/kota tidak boleh kosong.';
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

        // Validasi kode_kabkota jika diisi
        if (!Validator.isEmpty(data.kode_kabkota)) {
            if (!Validator.isLength(data.kode_kabkota, {
                    min: 1,
                    max: 10
                })) {
                errors.kode_kabkota = 'kode kabupaten/kota maksimal 10 karakter.';
            }
        }

        // Validasi ids_provinsi jika diisi
        if (!Validator.isEmpty(data.ids_provinsi)) {
            if (!Validator.isInt(data.ids_provinsi)) {
                errors.ids_provinsi = 'ids provinsi tidak valid.';
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