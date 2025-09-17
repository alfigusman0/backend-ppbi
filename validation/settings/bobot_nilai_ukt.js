/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.nama_field = !isEmpty(data.nama_field) ? data.nama_field : '';
    data.alias = !isEmpty(data.alias) ? data.alias : '';
    data.bobot = !isEmpty(data.bobot) ? data.bobot : '';
    data.nilai_max = !isEmpty(data.nilai_max) ? data.nilai_max : '';
    data.ids_jalur_masuk = !isEmpty(data.ids_jalur_masuk) ? data.ids_jalur_masuk : '';
    data.tahun = !isEmpty(data.tahun) ? data.tahun : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.nama_field)) {
            errors.nama_field = 'nama field cannot be empty.';
        }

        if (Validator.isEmpty(data.alias)) {
            errors.alias = 'alias cannot be empty.';
        }

        if (Validator.isEmpty(data.bobot)) {
            errors.bobot = 'bobot cannot be empty.';
        } else {
            if (!Validator.isFloat(data.bobot)) {
                errors.bobot = 'invalid bobot.';
            }
        }

        if (Validator.isEmpty(data.nilai_max)) {
            errors.nilai_max = 'nilai_max cannot be empty.';
        } else {
            if (!Validator.isFloat(data.nilai_max)) {
                errors.nilai_max = 'invalid nilai_max.';
            }
        }

        if (Validator.isEmpty(data.ids_jalur_masuk)) {
            errors.ids_jalur_masuk = 'ids_jalur_masuk cannot be empty.';
        } else {
            if (!Validator.isInt(data.ids_jalur_masuk)) {
                errors.ids_jalur_masuk = 'invalid ids_jalur_masuk.';
            }
        }

        if (Validator.isEmpty(data.tahun)) {
            errors.tahun = 'tahun cannot be empty.';
        } else {
            if (!Validator.isInt(data.tahun)) {
                errors.tahun = 'invalid tahun.';
            }
        }
    } else {
        if (!Validator.isEmpty(data.bobot)) {
            if (!Validator.isFloat(data.bobot)) {
                errors.bobot = 'invalid bobot.';
            }
        }

        if (!Validator.isEmpty(data.nilai_max)) {
            if (!Validator.isFloat(data.nilai_max)) {
                errors.nilai_max = 'invalid nilai_max.';
            }
        }

        if (!Validator.isEmpty(data.ids_jalur_masuk)) {
            if (!Validator.isInt(data.ids_jalur_masuk)) {
                errors.ids_jalur_masuk = 'invalid ids_jalur_masuk.';
            }
        }

        if (!Validator.isEmpty(data.tahun)) {
            if (!Validator.isInt(data.tahun)) {
                errors.tahun = 'invalid tahun.';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};