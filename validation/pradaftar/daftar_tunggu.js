/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.idp_formulir = !isEmpty(data.idp_formulir) ? data.idp_formulir : '';
    data.kode_jurusan_1 = !isEmpty(data.kode_jurusan_1) ? data.kode_jurusan_1 : '';
    data.kode_jurusan_2 = !isEmpty(data.kode_jurusan_2) ? data.kode_jurusan_2 : '';
    data.ketersediaan = !isEmpty(data.ketersediaan) ? data.ketersediaan : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.idp_formulir)) {
            errors.idp_formulir = 'idp formulir cannot be empty.';
        } else {
            if (!Validator.isInt(data.idp_formulir)) {
                errors.idp_formulir = 'invalid idp formulir.';
            }
        }

        if (Validator.isEmpty(data.kode_jurusan_1)) {
            errors.kode_jurusan_1 = 'kode jurusan 1 cannot be empty.';
        } else {
            if (!Validator.isLength(data.kode_jurusan_1, {
                    min: 3,
                    max: 3
                })) {
                errors.kode_jurusan_1 = 'kode jurusan 1 must be at most 3 characters.';
            }
        }

        if (Validator.isEmpty(data.kode_jurusan_2)) {
            errors.kode_jurusan_2 = 'kode jurusan 2 cannot be empty.';
        } else {
            if (!Validator.isLength(data.kode_jurusan_2, {
                    min: 3,
                    max: 3
                })) {
                errors.kode_jurusan_2 = 'kode jurusan 2 must be at most 3 characters.';
            }
        }

        if (Validator.isEmpty(data.ketersediaan)) {
            errors.ketersediaan = 'ketersediaan cannot be empty.';
        } else {
            if (data.ketersediaan !== '#') {
                if (!Validator.isURL(data.ketersediaan, {
                        require_protocol: true,
                        allow_underscores: true,
                        allow_trailing_dot: true,
                        host_whitelist: ['localhost', 's3.uinsgd.ac.id']
                    })) {
                    errors.ketersediaan = 'invalid ketersediaan';
                }
            }
        }

        if (Validator.isEmpty(data.status)) {
            errors.status = 'status cannot be empty.';
        } else {
            if (!Validator.isIn(data.status, ['Draf', 'Submit', 'Disetujui', 'Ditolak'])) {
                errors.status = 'invalid status.';
            }
        }
    } else if (method === 'PUT') {
        if (!Validator.isEmpty(data.idp_formulir)) {
            if (!Validator.isInt(data.idp_formulir)) {
                errors.idp_formulir = 'invalid idp formulir.';
            }
        }

        if (!Validator.isEmpty(data.kode_jurusan_1)) {
            if (!Validator.isLength(data.kode_jurusan_1, {
                    min: 3,
                    max: 3
                })) {
                errors.kode_jurusan_1 = 'kode jurusan 1 must be at most 3 characters.';
            }
        }

        if (!Validator.isEmpty(data.kode_jurusan_2)) {
            if (!Validator.isLength(data.kode_jurusan_2, {
                    min: 3,
                    max: 3
                })) {
                errors.kode_jurusan_2 = 'kode jurusan 2 must be at most 3 characters.';
            }
        }

        if (!Validator.isEmpty(data.ketersediaan)) {
            if (data.ketersediaan !== '#') {
                if (!Validator.isURL(data.ketersediaan, {
                        require_protocol: true,
                        allow_underscores: true,
                        allow_trailing_dot: true,
                        host_whitelist: ['localhost', 's3.uinsgd.ac.id']
                    })) {
                    errors.ketersediaan = 'invalid ketersediaan';
                }
            }
        }

        if (!Validator.isEmpty(data.status)) {
            if (!Validator.isIn(data.status, ['Draf', 'Submit', 'Disetujui', 'Ditolak'])) {
                errors.status = 'invalid status.';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};