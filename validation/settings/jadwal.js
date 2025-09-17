/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.ids_tipe_ujian = !isEmpty(data.ids_tipe_ujian) ? data.ids_tipe_ujian : '';
    data.tanggal = !isEmpty(data.tanggal) ? data.tanggal : '';
    data.jam_awal = !isEmpty(data.jam_awal) ? data.jam_awal : '';
    data.jam_akhir = !isEmpty(data.jam_akhir) ? data.jam_akhir : '';
    data.ids_ruangan = !isEmpty(data.ids_ruangan) ? data.ids_ruangan : '';
    data.quota = !isEmpty(data.quota) ? data.quota : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.ids_tipe_ujian)) {
            errors.ids_tipe_ujian = 'ids level cannot be empty.';
        } else {
            if (!Validator.isInt(data.ids_tipe_ujian)) {
                errors.ids_tipe_ujian = 'invalid ids level.';
            }
        }

        if (Validator.isEmpty(data.tanggal)) {
            errors.tanggal = 'tanggal cannot be empty.';
        } else {
            if (!Validator.isDate(data.tanggal)) {
                errors.tanggal = 'invalid tanggal.';
            }
        }

        if (Validator.isEmpty(data.jam_awal)) {
            errors.jam_awal = 'jam awal cannot be empty.';
        } else {
            if (!Validator.isTime(data.jam_awal, {
                    mode: 'withSeconds',
                    hourFormat: 'hour24'
                })) {
                errors.jam_awal = 'invalid jam awal.';
            }
        }

        if (Validator.isEmpty(data.jam_akhir)) {
            errors.jam_akhir = 'jam akhir cannot be empty.';
        } else {
            if (!Validator.isTime(data.jam_akhir, {
                    mode: 'withSeconds',
                    hourFormat: 'hour24'
                })) {
                errors.jam_akhir = 'invalid jam akhir.';
            }
        }

        if (Validator.isEmpty(data.ids_ruangan)) {
            errors.ids_ruangan = 'ids ruangan cannot be empty.';
        } else {
            if (!Validator.isInt(data.ids_ruangan)) {
                errors.ids_ruangan = 'invalid ids ruangan.';
            }
        }

        if (Validator.isEmpty(data.quota)) {
            errors.quota = 'quota cannot be empty.';
        } else {
            if (Validator.isInt(data.quota) || data.quota <= 0) {
                errors.quota = 'invalid quota.';
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
        if (!Validator.isEmpty(data.ids_tipe_ujian)) {
            if (!Validator.isInt(data.ids_tipe_ujian)) {
                errors.ids_tipe_ujian = 'invalid ids level.';
            }
        }

        if (!Validator.isEmpty(data.tanggal)) {
            if (!Validator.isDate(data.tanggal)) {
                errors.tanggal = 'invalid tanggal.';
            }
        }

        if (!Validator.isEmpty(data.jam_awal)) {
            if (!Validator.isTime(data.jam_awal, {
                    mode: 'withSeconds',
                    hourFormat: 'hour24'
                })) {
                errors.jam_awal = 'invalid jam awal.';
            }
        }

        if (!Validator.isEmpty(data.jam_akhir)) {
            if (!Validator.isTime(data.jam_akhir, {
                    mode: 'withSeconds',
                    hourFormat: 'hour24'
                })) {
                errors.jam_akhir = 'invalid jam akhir.';
            }
        }

        if (!Validator.isEmpty(data.ids_ruangan)) {
            if (!Validator.isInt(data.ids_ruangan)) {
                errors.ids_ruangan = 'invalid ids ruangan.';
            }
        }

        if (!Validator.isEmpty(data.quota)) {
            if (!Validator.isInt(data.quota) || data.quota <= 0) {
                errors.quota = 'invalid quota.';
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