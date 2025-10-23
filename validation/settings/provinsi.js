/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.kode_provinsi = !isEmpty(data.kode_provinsi) ? data.kode_provinsi : '';
    data.provinsi = !isEmpty(data.provinsi) ? data.provinsi : '';
    data.pulau = !isEmpty(data.pulau) ? data.pulau : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};