/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.idd_kelulusan = !isEmpty(data.idd_kelulusan) ? data.idd_kelulusan : '';
    data.orangtua = !isEmpty(data.orangtua) ? data.orangtua : '';
    data.nik_orangtua = !isEmpty(data.nik_orangtua) ? data.nik_orangtua : '';
    data.nama_orangtua = !isEmpty(data.nama_orangtua) ? data.nama_orangtua : '';
    data.tgl_lahir_orangtua = !isEmpty(data.tgl_lahir_orangtua) ? data.tgl_lahir_orangtua : '';
    data.ids_pendidikan = !isEmpty(data.ids_pendidikan) ? data.ids_pendidikan : '';
    data.ids_pekerjaan = !isEmpty(data.ids_pekerjaan) ? data.ids_pekerjaan : '';
    data.ids_penghasilan = !isEmpty(data.ids_penghasilan) ? data.ids_penghasilan : '';
    data.nominal_penghasilan = !isEmpty(data.nominal_penghasilan) ? data.nominal_penghasilan : '';
    data.terbilang_penghasilan = !isEmpty(data.terbilang_penghasilan) ? data.terbilang_penghasilan : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.idd_kelulusan)) {
            errors.idd_kelulusan = 'idd_kelulusan wajib diisi';
        } else {
            if (!Validator.isInt(data.idd_kelulusan)) {
                errors.idd_kelulusan = 'idd kelulusan harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.orangtua)) {
            errors.orangtua = 'orangtua wajib diisi';
        } else {
            if (!Validator.isIn(data.orangtua, ['Ayah', 'Ibu', 'Wali'])) {
                errors.orangtua = 'orangtua harus diisi dengan Ayah, Ibu, atau Wali';
            }
        }

        if (!Validator.isEmpty(data.nik_orangtua)) {
            if (data.nik_orangtua != 0) {
                if (!Validator.isLength(data.nik_orangtua, {
                        min: 10,
                        max: 16
                    })) {
                    errors.nik_orangtua = 'nik orang tua minimal 10 karakter dan maksimal 16 karakter';
                }
            }
        }

        if (Validator.isEmpty(data.nama_orangtua)) {
            errors.nama_orangtua = 'nama_orangtua wajib diisi';
        } else {
            if (!Validator.isLength(data.nama_orangtua, {
                    min: 2,
                    max: 100
                })) {
                errors.nama_orangtua = 'nama orang tua minimal 2 karakter dan maksimal 100 karakter';
            }
        }

        if (Validator.isEmpty(data.tgl_lahir_orangtua)) {
            errors.tgl_lahir_orangtua = 'tgl_lahir_orangtua wajib diisi';
        } else {
            if (!Validator.isDate(data.tgl_lahir_orangtua)) {
                errors.tgl_lahir_orangtua = 'tgl_lahir_orangtua harus berupa tanggal yang valid (yyyy-mm-dd)';
            }
        }

        if (Validator.isEmpty(data.ids_pendidikan)) {
            errors.ids_pendidikan = 'ids_pendidikan wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_pendidikan)) {
                errors.ids_pendidikan = 'ids pendidikan harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.ids_pekerjaan)) {
            errors.ids_pekerjaan = 'ids_pekerjaan wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_pekerjaan)) {
                errors.ids_pekerjaan = 'ids pekerjaan harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.ids_penghasilan)) {
            errors.ids_penghasilan = 'ids_penghasilan wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_penghasilan)) {
                errors.ids_penghasilan = 'ids penghasilan harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.nominal_penghasilan)) {
            errors.nominal_penghasilan = 'nominal_penghasilan wajib diisi';
        } else {
            if (!Validator.isInt(data.nominal_penghasilan) || data.nominal_penghasilan < 0) {
                errors.nominal_penghasilan = 'nominal penghasilan harus berupa angka positif';
            }
        }

        if (Validator.isEmpty(data.terbilang_penghasilan)) {
            errors.terbilang_penghasilan = 'terbilang penghasilan wajib diisi';
        } else {
            if (!Validator.isLength(data.terbilang_penghasilan, {
                    min: 2,
                    max: 100
                })) {
                errors.terbilang_penghasilan = 'terbilang penghasilan minimal 2 karakter dan maksimal 100 karakter';
            }
        }
    } else if (method === 'PUT') {
        if (!Validator.isEmpty(data.idd_kelulusan)) {
            if (!Validator.isInt(data.idd_kelulusan)) {
                errors.idd_kelulusan = 'idd kelulusan harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.orangtua)) {
            if (!Validator.isIn(data.orangtua, ['Ayah', 'Ibu', 'Wali'])) {
                errors.orangtua = 'orangtua harus diisi dengan Ayah, Ibu, atau Wali';
            }
        }

        if (!Validator.isEmpty(data.nik_orangtua)) {
            console.log(data.nik_orangtua);
            if (data.nik_orangtua != 0) {
                if (!Validator.isLength(data.nik_orangtua, {
                        min: 10,
                        max: 16
                    })) {
                    errors.nik_orangtua = 'nik orang tua minimal 10 karakter dan maksimal 16 karakter';
                }
            }
        }

        if (!Validator.isEmpty(data.nama_orangtua)) {
            if (!Validator.isLength(data.nama_orangtua, {
                    min: 2,
                    max: 100
                })) {
                errors.nama_orangtua = 'nama orang tua minimal 2 karakter dan maksimal 100 karakter';
            }
        }

        if (!Validator.isEmpty(data.tgl_lahir_orangtua)) {
            if (!Validator.isDate(data.tgl_lahir_orangtua)) {
                errors.tgl_lahir_orangtua = 'tgl_lahir_orangtua harus berupa tanggal yang valid (yyyy-mm-dd)';
            }
        }

        if (!Validator.isEmpty(data.ids_pendidikan)) {
            if (!Validator.isInt(data.ids_pendidikan)) {
                errors.ids_pendidikan = 'ids pendidikan harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_pekerjaan)) {
            if (!Validator.isInt(data.ids_pekerjaan)) {
                errors.ids_pekerjaan = 'ids pekerjaan harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_penghasilan)) {
            if (!Validator.isInt(data.ids_penghasilan)) {
                errors.ids_penghasilan = 'ids penghasilan harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.nominal_penghasilan)) {
            if (!Validator.isInt(data.nominal_penghasilan) || data.nominal_penghasilan < 0) {
                errors.nominal_penghasilan = 'nominal penghasilan harus berupa angka positif';
            }
        }

        if (!Validator.isEmpty(data.terbilang_penghasilan)) {
            if (!Validator.isLength(data.terbilang_penghasilan, {
                    min: 2,
                    max: 100
                })) {
                errors.terbilang_penghasilan = 'terbilang penghasilan minimal 2 karakter dan maksimal 100 karakter';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};