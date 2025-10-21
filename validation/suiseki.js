/* Libraries */
const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.id_profile = !isEmpty(data.id_profile) ? data.id_profile : '';
    data.ids_jenis_suiseki = !isEmpty(data.ids_jenis_suiseki) ? data.ids_jenis_suiseki : '';
    data.ids_kelas = !isEmpty(data.ids_kelas) ? data.ids_kelas : '';
    data.ukuran = !isEmpty(data.ukuran) ? data.ukuran : '';
    data.foto = !isEmpty(data.foto) ? data.foto : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};