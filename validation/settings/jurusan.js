/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.kode_jurusan = !isEmpty(data.kode_jurusan) ? data.kode_jurusan : '';
    data.kategori = !isEmpty(data.kategori) ? data.kategori : '';
    data.tipe_ujian = !isEmpty(data.tipe_ujian) ? data.tipe_ujian : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.kode_jurusan)) {
            errors.kode_jurusan = 'kode jurusan cannot be empty.';
        }

        if (Validator.isEmpty(data.kategori)) {
            errors.kategori = 'kategori cannot be empty.';
        } else {
            if (!Validator.isIn(data.kategori, ['IPA', 'IPS'])) {
                errors.kategori = 'invalid kategori.';
            }
        }

        if (!Validator.isEmpty(data.tipe_ujian)) {
            // validation for extensi ex: '1', '1,5,3', '1,10,100,5000'
            const extPattern = /^(\d{1,5})(,\d{1,5})*$/;
            if (!extPattern.test(data.tipe_ujian)) {
                errors.tipe_ujian = 'invalid tipe ujian value.';
            }
        }

        if (Validator.isEmpty(data.status)) {
            errors.status = 'status cannot be empty.';
        } else {
            if (!Validator.isIn(data.status, ['YA', 'TIDAK'])) {
                errors.status = 'invalid status.';
            }
        }
    } else {
        if (!Validator.isEmpty(data.kategori)) {
            if (!Validator.isIn(data.kategori, ['IPA', 'IPS'])) {
                errors.kategori = 'invalid kategori.';
            }
        }

        if (!Validator.isEmpty(data.tipe_ujian)) {
            // validation for extensi ex: '1', '1,5,3', '1,10,100,5000'
            const extPattern = /^(\d{1,5})(,\d{1,5})*$/;
            if (!extPattern.test(data.tipe_ujian)) {
                errors.tipe_ujian = 'invalid tipe ujian value.';
            }
        }

        if (!Validator.isEmpty(data.status)) {
            if (!Validator.isIn(data.status, ['YA', 'TIDAK'])) {
                errors.status = 'invalid status.';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};