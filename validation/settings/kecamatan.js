/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.kode_kecamatan = !isEmpty(data.kode_kecamatan) ? data.kode_kecamatan : '';
    data.ids_kabkota = !isEmpty(data.ids_kabkota) ? data.ids_kabkota : '';
    data.kecamatan = !isEmpty(data.kecamatan) ? data.kecamatan : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    // Validasi untuk method POST (Create)
    if (method === 'POST') {
        // Validasi field kode_kecamatan (wajib diisi dan max 15 karakter)
        if (Validator.isEmpty(data.kode_kecamatan)) {
            errors.kode_kecamatan = 'kode kecamatan tidak boleh kosong.';
        } else {
            if (!Validator.isLength(data.kode_kecamatan, {
                    min: 1,
                    max: 15
                })) {
                errors.kode_kecamatan = 'kode kecamatan maksimal 15 karakter.';
            }
        }

        // Validasi field ids_kabkota (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.ids_kabkota)) {
            errors.ids_kabkota = 'ids kabupaten/kota tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.ids_kabkota)) {
                errors.ids_kabkota = 'ids kabupaten/kota tidak valid.';
            }
        }

        // Validasi field kecamatan (wajib diisi)
        if (Validator.isEmpty(data.kecamatan)) {
            errors.kecamatan = 'nama kecamatan tidak boleh kosong.';
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

        // Validasi kode_kecamatan jika diisi
        if (!Validator.isEmpty(data.kode_kecamatan)) {
            if (!Validator.isLength(data.kode_kecamatan, {
                    min: 1,
                    max: 15
                })) {
                errors.kode_kecamatan = 'kode kecamatan maksimal 15 karakter.';
            }
        }

        // Validasi ids_kabkota jika diisi
        if (!Validator.isEmpty(data.ids_kabkota)) {
            if (!Validator.isInt(data.ids_kabkota)) {
                errors.ids_kabkota = 'ids kabupaten/kota tidak valid.';
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