/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.kode_kecamatan = !isEmpty(data.kode_kecamatan) ? data.kode_kecamatan : '';
    data.ids_kabkota = !isEmpty(data.ids_kabkota) ? data.ids_kabkota : '';
    data.kecamatan = !isEmpty(data.kecamatan) ? data.kecamatan : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};