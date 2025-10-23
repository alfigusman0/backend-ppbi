/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.ids_cabang = !isEmpty(data.ids_cabang) ? data.ids_cabang : '';
    data.ketua = !isEmpty(data.ketua) ? data.ketua : '';
    data.sekertaris = !isEmpty(data.sekertaris) ? data.sekertaris : '';
    data.bendahara = !isEmpty(data.bendahara) ? data.bendahara : '';
    data.profile = !isEmpty(data.profile) ? data.profile : '';
    data.visi = !isEmpty(data.visi) ? data.visi : '';
    data.misi = !isEmpty(data.misi) ? data.misi : '';
    data.program = !isEmpty(data.program) ? data.program : '';
    data.nomor_sk = !isEmpty(data.nomor_sk) ? data.nomor_sk : '';
    data.masa_aktif = !isEmpty(data.masa_aktif) ? data.masa_aktif : '';
    data.file_sk = !isEmpty(data.file_sk) ? data.file_sk : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};