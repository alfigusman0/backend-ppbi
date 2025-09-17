/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.kategori = !isEmpty(data.kategori) ? data.kategori : '';
    data.nilai_min = !isEmpty(data.nilai_min) ? data.nilai_min : '';
    data.nilai_max = !isEmpty(data.nilai_max) ? data.nilai_max : '';
    data.ids_jalur_masuk = !isEmpty(data.ids_jalur_masuk) ? data.ids_jalur_masuk : '';
    data.tahun = !isEmpty(data.tahun) ? data.tahun : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.kategori)) {
            errors.kategori = 'kategori cannot be empty.';
        } else {
            if (!Validator.isIn(data.kategori, ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7'])) {
                errors.kategori = 'invalid kategori.';
            }
        }

        if (Validator.isEmpty(data.nilai_min)) {
            errors.nilai_min = 'nilai_min cannot be empty.';
        } else {
            if (!Validator.isFloat(data.nilai_min)) {
                errors.nilai_min = 'invalid nilai_min.';
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
        if (!Validator.isEmpty(data.kategori)) {
            if (!Validator.isIn(data.kategori, ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7'])) {
                errors.kategori = 'invalid kategori.';
            }
        }

        if (!Validator.isEmpty(data.nilai_min)) {
            if (!Validator.isFloat(data.nilai_min)) {
                errors.nilai_min = 'invalid nilai_min.';
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