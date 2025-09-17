/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.kode_program = !isEmpty(data.kode_program) ? data.kode_program : '';
    data.program = !isEmpty(data.program) ? data.program : '';
    data.jenjang = !isEmpty(data.jenjang) ? data.jenjang : '';
    data.kelas = !isEmpty(data.kelas) ? data.kelas : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.kode_program)) {
            errors.kode_program = 'kode_program cannot be empty.';
        } else {
            if (!Validator.isInt(data.kode_program)) {
                errors.kode_program = 'invalid kode_program.';
            }
        }

        if (Validator.isEmpty(data.program)) {
            errors.program = 'program cannot be empty.';
        }

        if (Validator.isEmpty(data.jenjang)) {
            errors.jenjang = 'jenjang cannot be empty.';
        } else {
            const jenjang = data.jenjang.split(',');
            for (let i = 0; i < jenjang.length; i++) {
                if (!Validator.isIn(jenjang[i], ['S1', 'S2', 'S3'])) {
                    errors.jenjang = `invalid jenjang: ${jenjang[i]}.`;
                    break;
                }
            }
        }

        if (Validator.isEmpty(data.kelas)) {
            errors.kelas = 'kelas cannot be empty.';
        } else {
            const kelas = data.kelas.split(',');
            for (let i = 0; i < kelas.length; i++) {
                if (!Validator.isIn(kelas[i], ['REGULER', 'NON-REGULER', 'INTERNASIONAL'])) {
                    errors.kelas = `invalid kelas: ${kelas[i]}.`;
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
        if (!Validator.isEmpty(data.kode_program)) {
            if (!Validator.isInt(data.kode_program)) {
                errors.kode_program = 'invalid kode_program.';
            }
        }

        if (!Validator.isEmpty(data.jenjang)) {
            const jenjang = data.jenjang.split(',');
            for (let i = 0; i < jenjang.length; i++) {
                if (!Validator.isIn(jenjang[i], ['S1', 'S2', 'S3'])) {
                    errors.jenjang = `invalid jenjang: ${jenjang[i]}.`;
                    break;
                }
            }
        }

        if (!Validator.isEmpty(data.kelas)) {
            const kelas = data.kelas.split(',');
            for (let i = 0; i < kelas.length; i++) {
                if (!Validator.isIn(kelas[i], ['REGULER', 'NON-REGULER', 'INTERNASIONAL'])) {
                    errors.kelas = `invalid kelas: ${kelas[i]}.`;
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