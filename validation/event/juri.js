/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.id_event = !isEmpty(data.id_event) ? data.id_event : '';
    data.id_profile = !isEmpty(data.id_profile) ? data.id_profile : '';
    data.penialaian = !isEmpty(data.penialaian) ? data.penialaian : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};