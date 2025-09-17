/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.ids_program = !isEmpty(data.ids_program) ? data.ids_program : '';
    data.tipe_ujian = !isEmpty(data.tipe_ujian) ? data.tipe_ujian : '';
    data.kode = !isEmpty(data.kode) ? data.kode : '';
    data.status_jadwal = !isEmpty(data.status_jadwal) ? data.status_jadwal : '';
    data.quota = !isEmpty(data.quota) ? data.quota : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.ids_program)) {
            errors.ids_program = 'ids_program cannot be empty.';
        } else {
            if (!Validator.isInt(data.ids_program)) {
                errors.ids_program = 'invalid ids_program value.';
            }
        }

        if (Validator.isEmpty(data.tipe_ujian)) {
            errors.tipe_ujian = 'tipe_ujian cannot be empty.';
        }

        if (Validator.isEmpty(data.kode)) {
            errors.kode = 'kode cannot be empty.';
        } else {
            if (!Validator.isInt(data.kode) && data.kode <= 0) {
                errors.kode = 'invalid kode value.';
            }
        }

        if (Validator.isEmpty(data.status_jadwal)) {
            errors.status_jadwal = 'status_jadwal cannot be empty.';
        } else {
            if (!Validator.isIn(data.status_jadwal, ['YA', 'TIDAK'])) {
                errors.status_jadwal = 'invalid status_jadwal value.';
            }
        }

        if (Validator.isEmpty(data.quota)) {
            errors.template = 'quota cannot be empty.';
        } else {
            if (!Validator.isInt(data.quota) && data.quota < 0) {
                errors.quota = 'invalid quota value.';
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
        if (!Validator.isEmpty(data.ids_program)) {
            if (!Validator.isInt(data.ids_program)) {
                errors.ids_program = 'invalid ids_program value.';
            }
        }

        if (!Validator.isEmpty(data.kode)) {
            if (!Validator.isInt(data.kode) && data.kode <= 0) {
                errors.kode = 'invalid kode value.';
            }
        }

        if (!Validator.isEmpty(data.status_jadwal)) {
            if (!Validator.isIn(data.status_jadwal, ['YA', 'TIDAK'])) {
                errors.status_jadwal = 'invalid status_jadwal value.';
            }
        }

        if (!Validator.isEmpty(data.quota)) {
            if (!Validator.isInt(data.quota) && data.quota < 0) {
                errors.quota = 'invalid quota value.';
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