/* Libraries */
const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.pengantar_nama = !isEmpty(data.pengantar_nama) ? data.pengantar_nama : '';
    data.pengantar_alamat = !isEmpty(data.pengantar_alamat) ? data.pengantar_alamat : '';
    data.pengantar_handphone = !isEmpty(data.pengantar_handphone) ? data.pengantar_handphone : '';
    data.fotoktp = !isEmpty(data.fotoktp) ? data.fotoktp : '';
    data.fotosuratpernyataan = !isEmpty(data.fotosuratpernyataan) ? data.fotosuratpernyataan : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};