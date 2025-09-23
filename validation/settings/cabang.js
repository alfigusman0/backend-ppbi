/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.cabang = !isEmpty(data.cabang) ? data.cabang : '';
    data.ids_kabkota = !isEmpty(data.ids_kabkota) ? data.ids_kabkota : '';
    data.alamat = !isEmpty(data.alamat) ? data.alamat : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};