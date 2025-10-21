/* Libraries */
const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.id_user = !isEmpty(data.id_user) ? data.id_user : '';
    data.judul = !isEmpty(data.judul) ? data.judul : '';
    data.isi = !isEmpty(data.isi) ? data.isi : '';
    data.dibaca = !isEmpty(data.dibaca) ? data.dibaca : '';
    data.whatsapp = !isEmpty(data.whatsapp) ? data.whatsapp : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};