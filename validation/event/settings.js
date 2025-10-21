/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.id_event = !isEmpty(data.id_event) ? data.id_event : '';
    data.nama_setting = !isEmpty(data.nama_setting) ? data.nama_setting : '';
    data.setting = !isEmpty(data.setting) ? data.setting : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};