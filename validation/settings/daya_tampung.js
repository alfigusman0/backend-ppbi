/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.kode_jurusan = !isEmpty(data.kode_jurusan) ? data.kode_jurusan : '';
    data.kelas = !isEmpty(data.kelas) ? data.kelas : '';
    data.dt_awal = !isEmpty(data.dt_awal) ? data.dt_awal : '';
    data.daya_tampung = !isEmpty(data.daya_tampung) ? data.daya_tampung : '';
    data.afirmasi = !isEmpty(data.afirmasi) ? data.afirmasi : '';
    data.kuota = !isEmpty(data.kuota) ? data.kuota : '';
    data.grade = !isEmpty(data.grade) ? data.grade : '';
    data.nilai_min = !isEmpty(data.nilai_min) ? data.nilai_min : '';
    data.nilai_max = !isEmpty(data.nilai_max) ? data.nilai_max : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.kode_jurusan)) {
            errors.kode_jurusan = 'kode jurusan cannot be empty.';
        }

        if (Validator.isEmpty(data.kelas)) {
            errors.kelas = 'kelas cannot be empty.';
        } else {
            if (!Validator.isInt(data.kelas)) {
                errors.kelas = 'invalid kelas.';
            }
        }

        if (Validator.isEmpty(data.dt_awal)) {
            errors.dt_awal = 'daya tampung awal cannot be empty.';
        } else {
            if (!Validator.isInt(data.dt_awal) || data.dt_awal < 0) {
                errors.dt_awal = 'invalid daya tampung awal.';
            }
        }

        if (Validator.isEmpty(data.daya_tampung)) {
            errors.daya_tampung = 'daya tampung cannot be empty.';
        } else {
            if (!Validator.isInt(data.daya_tampung) || data.daya_tampung < 0) {
                errors.daya_tampung = 'invalid daya tampung.';
            }
        }

        if (Validator.isEmpty(data.afirmasi)) {
            errors.afirmasi = 'afirmasi cannot be empty.';
        } else {
            if (!Validator.isInt(data.afirmasi) || data.afirmasi < 0) {
                errors.afirmasi = 'invalid afirmasi.';
            }
        }

        if (Validator.isEmpty(data.kuota)) {
            errors.kuota = 'kuota cannot be empty.';
        } else {
            if (!Validator.isInt(data.kuota) || data.kuota < 0) {
                errors.kuota = 'invalid kuota.';
            }
        }

        if (Validator.isEmpty(data.grade)) {
            errors.grade = 'grade cannot be empty.';
        } else {
            if (!Validator.isFloat(data.grade)) {
                errors.grade = 'invalid grade.';
            }
        }

        if (Validator.isEmpty(data.nilai_min)) {
            errors.nilai_min = 'nilai_min cannot be empty.';
        } else {
            if (!Validator.isFloat(data.nilai_min)) {
                errors.nilai_min = 'invalid nilai minimal.';
            }
        }

        if (Validator.isEmpty(data.nilai_max)) {
            errors.nilai_max = 'nilai_max cannot be empty.';
        } else {
            if (!Validator.isFloat(data.nilai_max)) {
                errors.nilai_max = 'invalid nilai maksimal.';
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
        if (!Validator.isEmpty(data.kelas)) {
            if (!Validator.isInt(data.kelas)) {
                errors.kelas = 'invalid kelas.';
            }
        }

        if (!Validator.isEmpty(data.dt_awal)) {
            if (!Validator.isInt(data.dt_awal) || data.dt_awal < 0) {
                errors.dt_awal = 'invalid daya tampung awal.';
            }
        }

        if (!Validator.isEmpty(data.daya_tampung)) {
            if (!Validator.isInt(data.daya_tampung) || data.daya_tampung < 0) {
                errors.daya_tampung = 'invalid daya tampung.';
            }
        }

        if (!Validator.isEmpty(data.afirmasi)) {
            if (!Validator.isInt(data.afirmasi) || data.afirmasi < 0) {
                errors.afirmasi = 'invalid afirmasi.';
            }
        }

        if (!Validator.isEmpty(data.kuota)) {
            if (!Validator.isInt(data.kuota) || data.kuota < 0) {
                errors.kuota = 'invalid kuota.';
            }
        }

        if (!Validator.isEmpty(data.grade)) {
            if (!Validator.isFloat(data.grade)) {
                errors.grade = 'invalid grade.';
            }
        }

        if (!Validator.isEmpty(data.nilai_min)) {
            if (!Validator.isFloat(data.nilai_min)) {
                errors.nilai_min = 'invalid nilai minimal.';
            }
        }

        if (!Validator.isEmpty(data.nilai_max)) {
            if (!Validator.isFloat(data.nilai_max)) {
                errors.nilai_max = 'invalid nilai maksimal.';
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