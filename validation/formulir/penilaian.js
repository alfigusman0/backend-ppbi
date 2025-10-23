/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.id_formulir = !isEmpty(data.id_formulir) ? data.id_formulir : '';
    data.id_profile = !isEmpty(data.id_profile) ? data.id_profile : '';
    data.penampilan = !isEmpty(data.penampilan) ? data.penampilan : '';
    data.gerak_dasar = !isEmpty(data.gerak_dasar) ? data.gerak_dasar : '';
    data.keserasian = !isEmpty(data.keserasian) ? data.keserasian : '';
    data.kematangan = !isEmpty(data.kematangan) ? data.kematangan : '';
    data.total = !isEmpty(data.total) ? data.total : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};