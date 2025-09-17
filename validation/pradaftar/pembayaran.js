/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.idp_formulir = !isEmpty(data.idp_formulir) ? data.idp_formulir : '';

    if (method === 'POST') {} else if (method === 'PUT') {}

    return {
        errors,
        isValid: isEmpty(errors),
    };
};