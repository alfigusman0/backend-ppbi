/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.ids_level = !isEmpty(data.ids_level) ? data.ids_level : '';
    data.grup = !isEmpty(data.grup) ? data.grup : '';
    data.deskripsi = !isEmpty(data.deskripsi) ? data.deskripsi : '';
    data.keterangan = !isEmpty(data.keterangan) ? data.keterangan : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.ids_level)) {
            errors.ids_level = 'ids level cannot be empty.';
        } else {
            if (!Validator.isInt(data.ids_level)) {
                errors.ids_level = 'invalid ids level.';
            }
        }

        if (Validator.isEmpty(data.grup)) {
            errors.grup = 'grup cannot be empty.';
        }

        if (Validator.isEmpty(data.deskripsi)) {
            errors.deskripsi = 'daya tampung awal cannot be empty.';
        }

        if (Validator.isEmpty(data.status)) {
            errors.status = 'status cannot be empty.';
        } else {
            if (!Validator.isIn(data.status, ['YA', 'TIDAK'])) {
                errors.status = 'invalid status.';
            }
        }
    } else {
        if (!Validator.isEmpty(data.ids_level)) {
            if (!Validator.isInt(data.ids_level)) {
                errors.ids_level = 'invalid ids level.';
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