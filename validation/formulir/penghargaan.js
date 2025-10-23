/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.id_formulir = !isEmpty(data.id_formulir) ? data.id_formulir : '';
    data.id_juara = !isEmpty(data.id_juara) ? data.id_juara : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};