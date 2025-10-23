/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.id_event = !isEmpty(data.id_event) ? data.id_event : '';
    data.nomor_sertifikat = !isEmpty(data.nomor_sertifikat) ? data.nomor_sertifikat : '';
    data.no_registrasi = !isEmpty(data.no_registrasi) ? data.no_registrasi : '';
    data.no_juri = !isEmpty(data.no_juri) ? data.no_juri : '';
    data.id_pohon = !isEmpty(data.id_pohon) ? data.id_pohon : '';
    data.id_suiseki = !isEmpty(data.id_suiseki) ? data.id_suiseki : '';
    data.id_kategori = !isEmpty(data.id_kategori) ? data.id_kategori : '';
    data.ukuran = !isEmpty(data.ukuran) ? data.ukuran : '';
    data.bukti_bayar = !isEmpty(data.bukti_bayar) ? data.bukti_bayar : '';
    data.bayar = !isEmpty(data.bayar) ? data.bayar : '';
    data.cetak = !isEmpty(data.cetak) ? data.cetak : '';
    data.arena = !isEmpty(data.arena) ? data.arena : '';
    data.meja = !isEmpty(data.meja) ? data.meja : '';
    data.foto = !isEmpty(data.foto) ? data.foto : '';
    data.id_pengantar = !isEmpty(data.id_pengantar) ? data.id_pengantar : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};