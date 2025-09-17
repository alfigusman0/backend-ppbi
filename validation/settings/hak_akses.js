/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.ids_level = !isEmpty(data.ids_level) ? data.ids_level : '';
    data.ids_modul = !isEmpty(data.ids_modul) ? data.ids_modul : '';
    data.permission = !isEmpty(data.permission) ? data.permission : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.ids_level)) {
            errors.ids_level = 'ids level cannot be empty.';
        } else {
            if (!Validator.isInt(data.ids_level)) {
                errors.ids_level = 'invalid ids level.';
            }
        }

        if (Validator.isEmpty(data.ids_modul)) {
            errors.ids_modul = 'ids_modul cannot be empty.';
        } else {
            if (!Validator.isInt(data.ids_modul)) {
                errors.ids_modul = 'invalid ids_modul.';
            }
        }

        if (Validator.isEmpty(data.permission)) {
            errors.permission = 'permission cannot be empty.';
        }
    } else {
        if (!Validator.isEmpty(data.ids_level)) {
            if (!Validator.isInt(data.ids_level)) {
                errors.ids_level = 'invalid ids level.';
            }
        }

        if (!Validator.isEmpty(data.ids_modul)) {
            if (!Validator.isInt(data.ids_modul)) {
                errors.ids_modul = 'invalid ids_modul.';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};