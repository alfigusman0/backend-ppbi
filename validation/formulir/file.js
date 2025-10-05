/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.idd_kelulusan = !isEmpty(data.idd_kelulusan) ? data.idd_kelulusan : '';
    data.ids_tipe_file = !isEmpty(data.ids_tipe_file) ? data.ids_tipe_file : '';
    data.file = !isEmpty(data.file) ? data.file : '';
    data.url = !isEmpty(data.url) ? data.url : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.idd_kelulusan)) {
            errors.idd_kelulusan = 'idd kelulusan wajib diisi';
        } else {
            if (!Validator.isInt(data.idd_kelulusan)) {
                errors.idd_kelulusan = 'idd kelulusan harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.ids_tipe_file)) {
            errors.ids_tipe_file = 'idd tipe file wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_tipe_file)) {
                errors.ids_tipe_file = 'idd tipe file harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.file)) {
            errors.file = 'file wajib diisi';
        }

        if (Validator.isEmpty(data.url)) {
            errors.url = 'url cannot be empty.';
        } else {
            if (data.url !== '#') {
                if (!Validator.isURL(data.url, {
                        require_protocol: true,
                        allow_underscores: true,
                        allow_trailing_dot: true,
                        host_whitelist: ['localhost', 's3.uinsgd.ac.id']
                    })) {
                    errors.url = 'invalid url';
                }
            }
        }
    } else if (method === 'PUT') {
        if (!Validator.isEmpty(data.idd_kelulusan)) {
            if (!Validator.isInt(data.idd_kelulusan)) {
                errors.idd_kelulusan = 'idd kelulusan harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_tipe_file)) {
            if (!Validator.isInt(data.ids_tipe_file)) {
                errors.ids_tipe_file = 'idd tipe file harus berupa angka';
            }
        }


        if (!Validator.isEmpty(data.url)) {
            if (data.url !== '#') {
                if (!Validator.isURL(data.url, {
                        require_protocol: true,
                        allow_underscores: true,
                        allow_trailing_dot: true,
                        host_whitelist: ['localhost', 's3.uinsgd.ac.id']
                    })) {
                    errors.url = 'invalid url';
                }
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};