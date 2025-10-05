/* Libraries */
const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.test = !isEmpty(data.test) ? data.test : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};