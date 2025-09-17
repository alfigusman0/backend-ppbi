/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.kode_jurusan = !isEmpty(data.kode_jurusan) ? data.kode_jurusan : '';
    data.ids_jalur_masuk = !isEmpty(data.ids_jalur_masuk) ? data.ids_jalur_masuk : '';
    data.daya_tampung = !isEmpty(data.daya_tampung) ? data.daya_tampung : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.kode_jurusan)) {
            errors.kode_jurusan = 'kode jurusan cannot be empty.';
        }

        if (Validator.isEmpty(data.ids_jalur_masuk)) {
            errors.ids_jalur_masuk = 'ids_jalur_masuk cannot be empty.';
        } else {
            if (!Validator.isInt(data.ids_jalur_masuk)) {
                errors.ids_jalur_masuk = 'invalid ids_jalur_masuk.';
            }
        }

        if (Validator.isEmpty(data.daya_tampung)) {
            errors.daya_tampung = 'daya tampung cannot be empty.';
        } else {
            if (!Validator.isInt(data.daya_tampung) || data.daya_tampung < 0) {
                errors.daya_tampung = 'invalid daya tampung.';
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
        if (!Validator.isEmpty(data.ids_jalur_masuk)) {
            if (!Validator.isInt(data.ids_jalur_masuk)) {
                errors.ids_jalur_masuk = 'invalid ids_jalur_masuk.';
            }
        }

        if (!Validator.isEmpty(data.daya_tampung)) {
            if (!Validator.isInt(data.daya_tampung) || data.daya_tampung < 0) {
                errors.daya_tampung = 'invalid daya tampung.';
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