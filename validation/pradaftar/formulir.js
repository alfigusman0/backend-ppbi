/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.kategori = !isEmpty(data.kategori) ? data.kategori : '';
    data.ids_tipe_ujian = !isEmpty(data.ids_tipe_ujian) ? data.ids_tipe_ujian : '';
    data.formuir = !isEmpty(data.formuir) ? data.formuir : '';
    data.pembayaran = !isEmpty(data.pembayaran) ? data.pembayaran : '';
    data.ket_pembayaran = !isEmpty(data.ket_pembayaran) ? data.ket_pembayaran : '';
    data.id_user = !isEmpty(data.id_user) ? data.id_user : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.kategori)) {
            errors.kategori = 'kategori cannot be empty.';
        } else {
            if (!Validator.isIn(data.kategori, ['IPA', 'IPS'])) {
                errors.kategori = 'invalid kategori.';
            }
        }

        if (Validator.isEmpty(data.ids_tipe_ujian)) {
            errors.ids_tipe_ujian = 'ids_tipe_ujian cannot be empty.';
        } else {
            if (!Validator.isInt(data.ids_tipe_ujian)) {
                errors.ids_tipe_ujian = 'invalid ids_tipe_ujian.';
            }
        }

        if (!Validator.isEmpty(data.id_user)) {
            if (!Validator.isInt(data.id_user)) {
                errors.id_user = 'invalid id_user.';
            }
        }
    } else if (method === 'PUT') {
        if (!Validator.isEmpty(data.kategori)) {
            if (!Validator.isIn(data.kategori, ['YA', 'TIDAK'])) {
                errors.kategori = 'invalid kategori.';
            }
        }

        if (!Validator.isEmpty(data.ids_tipe_ujian)) {
            if (!Validator.isInt(data.ids_tipe_ujian)) {
                errors.ids_tipe_ujian = 'invalid ids_tipe_ujian.';
            }
        }

        if (!Validator.isEmpty(data.formulir)) {
            if (!Validator.isIn(data.formulir, ['BELUM', 'SUDAH'])) {
                errors.formulir = 'invalid formulir.';
            }
        }

        if (!Validator.isEmpty(data.pembayaran)) {
            if (!Validator.isIn(data.pembayaran, ['BELUM', 'SUDAH'])) {
                errors.pembayaran = 'invalid pembayaran.';
            }
        }

        if (!Validator.isEmpty(data.ket_pembayaran)) {
            if (!Validator.isLength(data.ket_pembayaran, {
                    min: 1,
                    max: 255
                })) {
                errors.ket_pembayaran = 'ket_pembayaran must be at least 1 characters but not more than 255 characters .';
            }
        }

        if (!Validator.isEmpty(data.id_user)) {
            if (!Validator.isInt(data.id_user)) {
                errors.id_user = 'invalid id_user.';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};