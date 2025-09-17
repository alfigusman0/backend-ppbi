/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.modul = !isEmpty(data.modul) ? data.modul : '';
    data.aksi = !isEmpty(data.aksi) ? data.aksi : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.modul)) {
            errors.modul = 'modul cannot be empty.';
        }

        if (Validator.isEmpty(data.aksi)) {
            errors.aksi = 'aksi cannot be empty.';
        } else {
            // validate aksi example : 'create', 'create,read,update', 'read,update,delete', 'create,read,update,delete,single,import,export,generate'
            const aksi = data.aksi.split(',');
            for (let i = 0; i < aksi.length; i++) {
                if (!Validator.isIn(aksi[i], ['create', 'read', 'update', 'delete', 'single', 'import', 'export', 'generate'])) {
                    errors.aksi = `invalid aksi: ${aksi[i]}.`;
                    break;
                }
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
        if (!Validator.isEmpty(data.aksi)) {
            // validate aksi example : 'create', 'create,read,update', 'read,update,delete', 'create,read,update,delete,single,import,export,generate'
            const aksi = data.aksi.split(',');
            for (let i = 0; i < aksi.length; i++) {
                if (!Validator.isIn(aksi[i], ['create', 'read', 'update', 'delete', 'single', 'import', 'export', 'generate'])) {
                    errors.aksi = `invalid aksi: ${aksi[i]}.`;
                    break;
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