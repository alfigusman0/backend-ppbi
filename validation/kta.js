/* Libraries */
const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.no_kta = !isEmpty(data.no_kta) ? data.no_kta : '';
    data.kta_lama = !isEmpty(data.kta_lama) ? data.kta_lama : '';
    data.id_profile = !isEmpty(data.id_profile) ? data.id_profile : '';
    data.masa_berlaku = !isEmpty(data.masa_berlaku) ? data.masa_berlaku : '';
    data.ids_cabang = !isEmpty(data.ids_cabang) ? data.ids_cabang : '';
    data.bukti_bayar = !isEmpty(data.bukti_bayar) ? data.bukti_bayar : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};