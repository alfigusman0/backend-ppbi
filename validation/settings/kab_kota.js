/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.kode_kabkota = !isEmpty(data.kode_kabkota) ? data.kode_kabkota : '';
    data.ids_provinsi = !isEmpty(data.ids_provinsi) ? data.ids_provinsi : '';
    data.kabkota = !isEmpty(data.kabkota) ? data.kabkota : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};