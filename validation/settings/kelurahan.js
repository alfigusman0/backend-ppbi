/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.kode_kelurahan = !isEmpty(data.kode_kelurahan) ? data.kode_kelurahan : '';
    data.ids_kecamatan = !isEmpty(data.ids_kecamatan) ? data.ids_kecamatan : '';
    data.kelurahan = !isEmpty(data.kelurahan) ? data.kelurahan : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};