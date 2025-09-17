/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.gambar = !isEmpty(data.gambar) ? data.gambar : '';
    data.konten = !isEmpty(data.konten) ? data.konten : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.gambar)) {
            errors.gambar = 'gambar cannot be empty.';
        } else {
            if (data.gambar !== '#') {
                if (!Validator.isURL(data.gambar)) {
                    errors.gambar = 'invalid gambar URL.';
                }
            }
        }

        if (Validator.isEmpty(data.konten)) {
            errors.konten = 'konten cannot be empty.';
        }

        if (Validator.isEmpty(data.status)) {
            errors.status = 'status cannot be empty.';
        } else {
            if (!Validator.isIn(data.status, ['YA', 'TIDAK'])) {
                errors.status = 'invalid status.';
            }
        }
    } else {
        if (!Validator.isEmpty(data.gambar)) {
            if (data.gambar !== '#') {
                if (!Validator.isURL(data.gambar)) {
                    errors.gambar = 'invalid gambar URL.';
                }
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