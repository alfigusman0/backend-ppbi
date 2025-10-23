/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.kode_kelurahan = !isEmpty(data.kode_kelurahan) ? data.kode_kelurahan : '';
    data.ids_kecamatan = !isEmpty(data.ids_kecamatan) ? data.ids_kecamatan : '';
    data.kelurahan = !isEmpty(data.kelurahan) ? data.kelurahan : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    // Validasi untuk method POST (Create)
    if (method === 'POST') {
        // Validasi field kode_kelurahan (wajib diisi dan max 20 karakter)
        if (Validator.isEmpty(data.kode_kelurahan)) {
            errors.kode_kelurahan = 'kode kelurahan tidak boleh kosong.';
        } else {
            if (!Validator.isLength(data.kode_kelurahan, {
                    min: 1,
                    max: 20
                })) {
                errors.kode_kelurahan = 'kode kelurahan maksimal 20 karakter.';
            }
        }

        // Validasi field ids_kecamatan (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.ids_kecamatan)) {
            errors.ids_kecamatan = 'ids kecamatan tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.ids_kecamatan)) {
                errors.ids_kecamatan = 'ids kecamatan tidak valid.';
            }
        }

        // Validasi field kelurahan (wajib diisi)
        if (Validator.isEmpty(data.kelurahan)) {
            errors.kelurahan = 'nama kelurahan tidak boleh kosong.';
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

        // Validasi kode_kelurahan jika diisi
        if (!Validator.isEmpty(data.kode_kelurahan)) {
            if (!Validator.isLength(data.kode_kelurahan, {
                    min: 1,
                    max: 20
                })) {
                errors.kode_kelurahan = 'kode kelurahan maksimal 20 karakter.';
            }
        }

        // Validasi ids_kecamatan jika diisi
        if (!Validator.isEmpty(data.ids_kecamatan)) {
            if (!Validator.isInt(data.ids_kecamatan)) {
                errors.ids_kecamatan = 'ids kecamatan tidak valid.';
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