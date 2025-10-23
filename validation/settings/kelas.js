/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.kode = !isEmpty(data.kode) ? data.kode : '';
    data.nama_kelas = !isEmpty(data.nama_kelas) ? data.nama_kelas : '';
    data.jenis = !isEmpty(data.jenis) ? data.jenis : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    // Validasi untuk method POST (Create)
    if (method === 'POST') {
        // Validasi field kode (opsional, tapi jika diisi harus max 10 karakter)
        if (!Validator.isEmpty(data.kode)) {
            if (!Validator.isLength(data.kode, {
                    min: 1,
                    max: 10
                })) {
                errors.kode = 'kode maksimal 10 karakter.';
            }
        }

        // Validasi field nama_kelas (wajib diisi dan max 100 karakter)
        if (Validator.isEmpty(data.nama_kelas)) {
            errors.nama_kelas = 'nama kelas tidak boleh kosong.';
        } else {
            if (!Validator.isLength(data.nama_kelas, {
                    min: 1,
                    max: 100
                })) {
                errors.nama_kelas = 'nama kelas maksimal 100 karakter.';
            }
        }

        // Validasi field jenis (opsional, tapi jika diisi harus enum 'Suiseki' atau 'Bonsai')
        if (!Validator.isEmpty(data.jenis)) {
            if (!Validator.isIn(data.jenis, ['Suiseki', 'Bonsai'])) {
                errors.jenis = 'jenis tidak valid. harus Suiseki atau Bonsai.';
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

        // Validasi kode jika diisi
        if (!Validator.isEmpty(data.kode)) {
            if (!Validator.isLength(data.kode, {
                    min: 1,
                    max: 10
                })) {
                errors.kode = 'kode maksimal 10 karakter.';
            }
        }

        // Validasi nama_kelas jika diisi
        if (!Validator.isEmpty(data.nama_kelas)) {
            if (!Validator.isLength(data.nama_kelas, {
                    min: 1,
                    max: 100
                })) {
                errors.nama_kelas = 'nama kelas maksimal 100 karakter.';
            }
        }

        // Validasi jenis jika diisi
        if (!Validator.isEmpty(data.jenis)) {
            if (!Validator.isIn(data.jenis, ['Suiseki', 'Bonsai'])) {
                errors.jenis = 'jenis tidak valid. harus Suiseki atau Bonsai.';
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