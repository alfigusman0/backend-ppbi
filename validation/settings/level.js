/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.level = !isEmpty(data.level) ? data.level : '';
    data.tingkat = !isEmpty(data.tingkat) ? data.tingkat : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.level)) {
            errors.level = 'level cannot be empty.';
        }

        if (Validator.isEmpty(data.tingkat)) {
            errors.tingkat = 'tingkat cannot be empty.';
        } else {
            if (!Validator.isInt(data.tingkat)) {
                errors.tingkat = 'invalid tingkat.';
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
        if (!Validator.isEmpty(data.tingkat)) {
            if (!Validator.isInt(data.tingkat)) {
                errors.tingkat = 'invalid tingkat.';
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