/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.idd_kelulusan = !isEmpty(data.idd_kelulusan) ? data.idd_kelulusan : '';
    data.ids_tanggungan = !isEmpty(data.ids_tanggungan) ? data.ids_tanggungan : '';
    data.ids_rekening_listrik = !isEmpty(data.ids_rekening_listrik) ? data.ids_rekening_listrik : '';
    data.ids_daya_listrik = !isEmpty(data.ids_daya_listrik) ? data.ids_daya_listrik : '';
    data.ids_kepemilikan_rumah = !isEmpty(data.ids_kepemilikan_rumah) ? data.ids_kepemilikan_rumah : '';
    data.ids_njop = !isEmpty(data.ids_njop) ? data.ids_njop : '';
    data.ids_lktl = !isEmpty(data.ids_lktl) ? data.ids_lktl : '';
    data.ids_kepemilikan_mobil = !isEmpty(data.ids_kepemilikan_mobil) ? data.ids_kepemilikan_mobil : '';
    data.ids_pajak_mobil = !isEmpty(data.ids_pajak_mobil) ? data.ids_pajak_mobil : '';
    data.ids_kepemilikan_motor = !isEmpty(data.ids_kepemilikan_motor) ? data.ids_kepemilikan_motor : '';
    data.ids_pajak_motor = !isEmpty(data.ids_pajak_motor) ? data.ids_pajak_motor : '';
    data.ids_kelurahan = !isEmpty(data.ids_kelurahan) ? data.ids_kelurahan : '';
    data.dusun = !isEmpty(data.dusun) ? data.dusun : '';
    data.rw = !isEmpty(data.rw) ? data.rw : '';
    data.rt = !isEmpty(data.rt) ? data.rt : '';
    data.jalan = !isEmpty(data.jalan) ? data.jalan : '';
    data.kode_pos = !isEmpty(data.kode_pos) ? data.kode_pos : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.idd_kelulusan)) {
            errors.idd_kelulusan = 'idd_kelulusan wajib diisi';
        } else {
            if (!Validator.isInt(data.idd_kelulusan)) {
                errors.idd_kelulusan = 'idd_kelulusan harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.ids_tanggungan)) {
            errors.ids_tanggungan = 'ids_tanggungan wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_tanggungan)) {
                errors.ids_tanggungan = 'ids_tanggungan harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.ids_rekening_listrik)) {
            errors.ids_rekening_listrik = 'ids_rekening_listrik wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_rekening_listrik)) {
                errors.ids_rekening_listrik = 'ids_rekening_listrik harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.ids_daya_listrik)) {
            errors.ids_daya_listrik = 'ids_daya_listrik wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_daya_listrik)) {
                errors.ids_daya_listrik = 'ids_daya_listrik harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.ids_kepemilikan_rumah)) {
            errors.ids_kepemilikan_rumah = 'ids_kepemilikan_rumah wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_kepemilikan_rumah)) {
                errors.ids_kepemilikan_rumah = 'ids_kepemilikan_rumah harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.ids_njop)) {
            errors.ids_njop = 'ids_njop wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_njop)) {
                errors.ids_njop = 'ids_njop harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.ids_lktl)) {
            errors.ids_lktl = 'ids_lktl wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_lktl)) {
                errors.ids_lktl = 'ids_lktl harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.ids_kepemilikan_mobil)) {
            errors.ids_kepemilikan_mobil = 'ids_kepemilikan_mobil wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_kepemilikan_mobil)) {
                errors.ids_kepemilikan_mobil = 'ids_kepemilikan_mobil harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.ids_pajak_mobil)) {
            errors.ids_pajak_mobil = 'ids_pajak_mobil wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_pajak_mobil)) {
                errors.ids_pajak_mobil = 'ids_pajak_mobil harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.ids_kepemilikan_motor)) {
            errors.ids_kepemilikan_motor = 'ids_kepemilikan_motor wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_kepemilikan_motor)) {
                errors.ids_kepemilikan_motor = 'ids_kepemilikan_motor harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.ids_pajak_motor)) {
            errors.ids_pajak_motor = 'ids_pajak_motor wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_pajak_motor)) {
                errors.ids_pajak_motor = 'ids_pajak_motor harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.ids_kelurahan)) {
            errors.ids_kelurahan = 'ids kelurahan wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_kelurahan)) {
                errors.ids_kelurahan = 'ids kelurahan harus berupa angka';
            }
        }
    } else if (method === 'PUT') {
        if (!Validator.isEmpty(data.idd_kelulusan)) {
            if (!Validator.isInt(data.idd_kelulusan)) {
                errors.idd_kelulusan = 'idd_kelulusan harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_tanggungan)) {
            if (!Validator.isInt(data.ids_tanggungan)) {
                errors.ids_tanggungan = 'ids_tanggungan harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_rekening_listrik)) {
            if (!Validator.isInt(data.ids_rekening_listrik)) {
                errors.ids_rekening_listrik = 'ids_rekening_listrik harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_daya_listrik)) {
            if (!Validator.isInt(data.ids_daya_listrik)) {
                errors.ids_daya_listrik = 'ids_daya_listrik harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_kepemilikan_rumah)) {
            if (!Validator.isInt(data.ids_kepemilikan_rumah)) {
                errors.ids_kepemilikan_rumah = 'ids_kepemilikan_rumah harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_njop)) {
            if (!Validator.isInt(data.ids_njop)) {
                errors.ids_njop = 'ids_njop harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_lktl)) {
            if (!Validator.isInt(data.ids_lktl)) {
                errors.ids_lktl = 'ids_lktl harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_kepemilikan_mobil)) {
            if (!Validator.isInt(data.ids_kepemilikan_mobil)) {
                errors.ids_kepemilikan_mobil = 'ids_kepemilikan_mobil harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_pajak_mobil)) {
            if (!Validator.isInt(data.ids_pajak_mobil)) {
                errors.ids_pajak_mobil = 'ids_pajak_mobil harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_kepemilikan_motor)) {
            if (!Validator.isInt(data.ids_kepemilikan_motor)) {
                errors.ids_kepemilikan_motor = 'ids_kepemilikan_motor harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_pajak_motor)) {
            if (!Validator.isInt(data.ids_pajak_motor)) {
                errors.ids_pajak_motor = 'ids_pajak_motor harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_kelurahan)) {
            if (!Validator.isInt(data.ids_kelurahan)) {
                errors.ids_kelurahan = 'ids kelurahan harus berupa angka';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};