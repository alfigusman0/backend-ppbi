/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.sanggah = !isEmpty(data.sanggah) ? data.sanggah : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.sanggah)) {
            errors.sanggah = 'sanggah cannot be empty.';
        }

        if (Validator.isEmpty(data.status)) {
            errors.status = 'status cannot be empty.';
        } else {
            if (!Validator.isIn(data.status, ['YA', 'TIDAK'])) {
                errors.status = 'invalid status.';
            }
        }
    } else {
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