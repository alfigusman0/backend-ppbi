/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.kode_provinsi = !isEmpty(data.kode_provinsi) ? data.kode_provinsi : '';
    data.provinsi = !isEmpty(data.provinsi) ? data.provinsi : '';
    data.pulau = !isEmpty(data.pulau) ? data.pulau : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    // Validasi untuk method POST (Create)
    if (method === 'POST') {
        // Validasi field kode_provinsi (wajib diisi dan max 5 karakter)
        if (Validator.isEmpty(data.kode_provinsi)) {
            errors.kode_provinsi = 'kode provinsi tidak boleh kosong.';
        } else {
            if (!Validator.isLength(data.kode_provinsi, {
                    min: 1,
                    max: 5
                })) {
                errors.kode_provinsi = 'kode provinsi maksimal 5 karakter.';
            }
        }

        // Validasi field provinsi (wajib diisi)
        if (Validator.isEmpty(data.provinsi)) {
            errors.provinsi = 'nama provinsi tidak boleh kosong.';
        }

        // Validasi field pulau (wajib diisi dan harus enum)
        if (Validator.isEmpty(data.pulau)) {
            errors.pulau = 'pulau tidak boleh kosong.';
        } else {
            const validPulau = ['PAPUA', 'KALIMANTAN', 'SUMATERA', 'SULAWESI', 'JAWA', 'TIMOR', 'HALMAHERA', 'SERAM', 'SUMBAWA', 'FLORES'];
            if (!Validator.isIn(data.pulau, validPulau)) {
                errors.pulau = `pulau tidak valid. harus salah satu dari: ${validPulau.join(', ')}.`;
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

        // Validasi kode_provinsi jika diisi
        if (!Validator.isEmpty(data.kode_provinsi)) {
            if (!Validator.isLength(data.kode_provinsi, {
                    min: 1,
                    max: 5
                })) {
                errors.kode_provinsi = 'kode provinsi maksimal 5 karakter.';
            }
        }

        // Validasi pulau jika diisi
        if (!Validator.isEmpty(data.pulau)) {
            const validPulau = ['PAPUA', 'KALIMANTAN', 'SUMATERA', 'SULAWESI', 'JAWA', 'TIMOR', 'HALMAHERA', 'SERAM', 'SUMBAWA', 'FLORES'];
            if (!Validator.isIn(data.pulau, validPulau)) {
                errors.pulau = `pulau tidak valid. harus salah satu dari: ${validPulau.join(', ')}.`;
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