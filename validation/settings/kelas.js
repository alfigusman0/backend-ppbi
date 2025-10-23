/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.kode = !isEmpty(data.kode) ? data.kode : '';
    data.nama_kelas = !isEmpty(data.nama_kelas) ? data.nama_kelas : '';
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