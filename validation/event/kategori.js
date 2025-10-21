/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.id_event = !isEmpty(data.id_event) ? data.id_event : '';
    data.ids_kelas = !isEmpty(data.ids_kelas) ? data.ids_kelas : '';
    data.nama_kategori = !isEmpty(data.nama_kategori) ? data.nama_kategori : '';
    data.ukuran_min = !isEmpty(data.ukuran_min) ? data.ukuran_min : '';
    data.ukuran_maks = !isEmpty(data.ukuran_maks) ? data.ukuran_maks : '';
    data.uang = !isEmpty(data.uang) ? data.uang : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};