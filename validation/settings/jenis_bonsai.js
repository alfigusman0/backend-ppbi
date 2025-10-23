/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.jenis_bonsai = !isEmpty(data.jenis_bonsai) ? data.jenis_bonsai : '';
    data.nama_latin = !isEmpty(data.nama_latin) ? data.nama_latin : '';
    data.jenis = !isEmpty(data.jenis) ? data.jenis : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};