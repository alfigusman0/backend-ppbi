/* Libraries */
const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.id_user = !isEmpty(data.id_user) ? data.id_user : '';
    data.judul = !isEmpty(data.judul) ? data.judul : '';
    data.isi = !isEmpty(data.isi) ? data.isi : '';
    data.dibaca = !isEmpty(data.dibaca) ? data.dibaca : '';
    data.whatsapp = !isEmpty(data.whatsapp) ? data.whatsapp : '';

    // Validasi untuk method POST (Create)
    if (method === 'POST') {
        // Validasi field id_user (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.id_user)) {
            errors.id_user = 'id user tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.id_user)) {
                errors.id_user = 'id user tidak valid.';
            }
        }

        // Validasi field judul (wajib diisi dan max 255 karakter)
        if (Validator.isEmpty(data.judul)) {
            errors.judul = 'judul tidak boleh kosong.';
        } else {
            if (!Validator.isLength(data.judul, {
                    min: 1,
                    max: 255
                })) {
                errors.judul = 'judul maksimal 255 karakter.';
            }
        }

        // Validasi field isi (wajib diisi)
        if (Validator.isEmpty(data.isi)) {
            errors.isi = 'isi notifikasi tidak boleh kosong.';
        }

        // Validasi field dibaca (wajib diisi dan harus enum 'TIDAK' atau 'YA')
        if (Validator.isEmpty(data.dibaca)) {
            errors.dibaca = 'dibaca tidak boleh kosong.';
        } else {
            if (!Validator.isIn(data.dibaca, ['TIDAK', 'YA'])) {
                errors.dibaca = 'dibaca tidak valid. harus TIDAK atau YA.';
            }
        }

        // Validasi field whatsapp (wajib diisi dan harus enum 'TIDAK', 'YA', atau 'ERROR')
        if (Validator.isEmpty(data.whatsapp)) {
            errors.whatsapp = 'whatsapp tidak boleh kosong.';
        } else {
            if (!Validator.isIn(data.whatsapp, ['TIDAK', 'YA', 'ERROR'])) {
                errors.whatsapp = 'whatsapp tidak valid. harus TIDAK, YA, atau ERROR.';
            }
        }
    } else {
        // Validasi untuk method lain (PUT/PATCH untuk Update)
        // Field bersifat opsional, tapi jika diisi harus valid

        // Validasi id_user jika diisi
        if (!Validator.isEmpty(data.id_user)) {
            if (!Validator.isInt(data.id_user)) {
                errors.id_user = 'id user tidak valid.';
            }
        }

        // Validasi judul jika diisi
        if (!Validator.isEmpty(data.judul)) {
            if (!Validator.isLength(data.judul, {
                    min: 1,
                    max: 255
                })) {
                errors.judul = 'judul maksimal 255 karakter.';
            }
        }

        // Validasi dibaca jika diisi
        if (!Validator.isEmpty(data.dibaca)) {
            if (!Validator.isIn(data.dibaca, ['TIDAK', 'YA'])) {
                errors.dibaca = 'dibaca tidak valid. harus TIDAK atau YA.';
            }
        }

        // Validasi whatsapp jika diisi
        if (!Validator.isEmpty(data.whatsapp)) {
            if (!Validator.isIn(data.whatsapp, ['TIDAK', 'YA', 'ERROR'])) {
                errors.whatsapp = 'whatsapp tidak valid. harus TIDAK, YA, atau ERROR.';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};