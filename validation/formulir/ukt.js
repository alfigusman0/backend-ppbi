/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.idd_kelulusan = !isEmpty(data.idd_kelulusan) ? data.idd_kelulusan : '';
    data.score = !isEmpty(data.score) ? data.score : '';
    data.kategori = !isEmpty(data.kategori) ? data.kategori : '';
    data.jumlah = !isEmpty(data.jumlah) ? data.jumlah : '';
    data.potongan = !isEmpty(data.potongan) ? data.potongan : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.idd_kelulusan)) {
            errors.idd_kelulusan = 'idd kelulusan wajib diisi';
        } else {
            if (!Validator.isInt(data.idd_kelulusan)) {
                errors.idd_kelulusan = 'idd kelulusan harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.score)) {
            errors.score = 'score wajib diisi';
        } else {
            if (!Validator.isFloat(data.score)) {
                errors.score = 'score harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.kategori)) {
            errors.kategori = 'kategori wajib diisi';
        } else {
            if (!Validator.isIn(data.kategori, ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9'])) {
                errors.kategori = 'kategori harus berupa K1 sampai K9.';
            }
        }

        if (Validator.isEmpty(data.jumlah)) {
            errors.jumlah = 'jumlah wajib diisi';
        } else {
            if (!Validator.isInt(data.jumlah)) {
                errors.jumlah = 'jumlah harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.potongan)) {
            errors.potongan = 'potongan wajib diisi';
        } else {
            if (!Validator.isInt(data.potongan)) {
                errors.potongan = 'potongan harus berupa angka';
            }
        }
    } else if (method === 'PUT') {
        if (!Validator.isEmpty(data.idd_kelulusan)) {
            if (!Validator.isInt(data.idd_kelulusan)) {
                errors.idd_kelulusan = 'idd kelulusan harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.score)) {
            if (!Validator.isFloat(data.score)) {
                errors.score = 'score harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.kategori)) {
            if (!Validator.isIn(data.kategori, ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9'])) {
                errors.kategori = 'kategori harus berupa K1 sampai K9.';
            }
        }

        if (!Validator.isEmpty(data.jumlah)) {
            if (!Validator.isInt(data.jumlah)) {
                errors.jumlah = 'jumlah harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.potongan)) {
            if (!Validator.isInt(data.potongan)) {
                errors.potongan = 'potongan harus berupa angka';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};