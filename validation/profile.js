/* Libraries */
const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.nama_lengkap = !isEmpty(data.nama_lengkap) ? data.nama_lengkap : '';
    data.jenis_kelamin = !isEmpty(data.jenis_kelamin) ? data.jenis_kelamin : '';
    data.ids_kelurahan = !isEmpty(data.ids_kelurahan) ? data.ids_kelurahan : '';
    data.rw = !isEmpty(data.rw) ? data.rw : '';
    data.rt = !isEmpty(data.rt) ? data.rt : '';
    data.alamat = !isEmpty(data.alamat) ? data.alamat : '';
    data.nmr_tlpn = !isEmpty(data.nmr_tlpn) ? data.nmr_tlpn : '';
    data.foto = !isEmpty(data.foto) ? data.foto : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};