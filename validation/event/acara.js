/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.ids_cabang = !isEmpty(data.ids_cabang) ? data.ids_cabang : '';
    data.nama_acara = !isEmpty(data.nama_acara) ? data.nama_acara : '';
    data.slug_event = !isEmpty(data.slug_event) ? data.slug_event : '';
    data.proposal = !isEmpty(data.proposal) ? data.proposal : '';
    data.tgl_awal_acara = !isEmpty(data.tgl_awal_acara) ? data.tgl_awal_acara : '';
    data.tgl_akhir_acara = !isEmpty(data.tgl_akhir_acara) ? data.tgl_akhir_acara : '';
    data.ids_kelurahan = !isEmpty(data.ids_kelurahan) ? data.ids_kelurahan : '';
    data.rw = !isEmpty(data.rw) ? data.rw : '';
    data.rt = !isEmpty(data.rt) ? data.rt : '';
    data.alamat = !isEmpty(data.alamat) ? data.alamat : '';
    data.poster = !isEmpty(data.poster) ? data.poster : '';
    data.bukti_bayar = !isEmpty(data.bukti_bayar) ? data.bukti_bayar : '';
    data.jenis = !isEmpty(data.jenis) ? data.jenis : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {

    } else {

    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};