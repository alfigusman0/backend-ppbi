/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.idd_kelulusan = !isEmpty(data.idd_kelulusan) ? data.idd_kelulusan : '';
    data.nik = !isEmpty(data.nik) ? data.nik : '';
    data.jenis_kelamin = !isEmpty(data.jenis_kelamin) ? data.jenis_kelamin : '';
    data.tempat_lahir = !isEmpty(data.tempat_lahir) ? data.tempat_lahir : '';
    data.tgl_lahir = !isEmpty(data.tgl_lahir) ? data.tgl_lahir : '';
    data.ids_agama = !isEmpty(data.ids_agama) ? data.ids_agama : '';
    data.kewarganegaraan = !isEmpty(data.kewarganegaraan) ? data.kewarganegaraan : '';
    data.ids_jenis_tinggal = !isEmpty(data.ids_jenis_tinggal) ? data.ids_jenis_tinggal : '';
    data.ids_alat_transportasi = !isEmpty(data.ids_alat_transportasi) ? data.ids_alat_transportasi : '';
    data.ids_sktm = !isEmpty(data.ids_sktm) ? data.ids_sktm : '';
    data.terima_kps = !isEmpty(data.terima_kps) ? data.terima_kps : '';
    data.no_kps = !isEmpty(data.no_kps) ? data.no_kps : '';
    data.ids_jenis_pendaftaran = !isEmpty(data.ids_jenis_pendaftaran) ? data.ids_jenis_pendaftaran : '';
    data.ids_jenis_pembiayaan = !isEmpty(data.ids_jenis_pembiayaan) ? data.ids_jenis_pembiayaan : '';
    data.ids_lktl = !isEmpty(data.ids_lktl) ? data.ids_lktl : '';
    data.ukuran_baju = !isEmpty(data.ukuran_baju) ? data.ukuran_baju : '';
    data.ukuran_jas = !isEmpty(data.ukuran_jas) ? data.ukuran_jas : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.idd_kelulusan)) {
            errors.idd_kelulusan = 'idd kelulusan wajib diisi';
        } else {
            if (!Validator.isInt(data.idd_kelulusan)) {
                errors.idd_kelulusan = 'idd kelulusan harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.nik)) {
            errors.nik = 'nik or passport wajib diisi';
        } else {
            if (data.kewarganegaraan == 'WNI') {
                if (!Validator.isLength(data.nik, {
                        min: 16,
                        max: 16
                    })) {
                    errors.nik = 'nik harus berupa 16 karakter';
                }
            } else {
                if (!Validator.isLength(data.nik, {
                        max: 9
                    })) {
                    errors.nik = 'passport tidak boleh lebih dari 9 karakter';
                }
            }
        }

        if (Validator.isEmpty(data.jenis_kelamin)) {
            errors.jenis_kelamin = 'jenis kelamin wajib diisi';
        } else {
            if (!Validator.isIn(data.jenis_kelamin, ['LAKI-LAKI', 'PEREMPUAN'])) {
                errors.jenis_kelamin = 'jenis kelamin harus berupa LAKI-LAKI atau PEREMPUAN';
            }
        }

        if (Validator.isEmpty(data.tempat_lahir)) {
            errors.tempat_lahir = 'tempat lahir wajib diisi';
        } else {
            if (!Validator.isLength(data.tempat_lahir, {
                    min: 3,
                    max: 50
                })) {
                errors.tempat_lahir = 'tempat lahir tidak boleh kurang dari 3 karakter atau lebih dari 50 karakter';
            }
        }

        if (Validator.isEmpty(data.tgl_lahir)) {
            errors.tgl_lahir = 'tanggal lahir wajib diisi';
        } else {
            if (!Validator.isDate(data.tgl_lahir)) {
                errors.tgl_lahir = 'tanggal lahir harus berupa tanggal yang valid';
            }
        }

        if (Validator.isEmpty(data.ids_agama)) {
            errors.ids_agama = 'agama wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_agama)) {
                errors.ids_agama = 'agama harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.kewarganegaraan)) {
            errors.kewarganegaraan = 'kewarganegaraan wajib diisi';
        } else {
            if (!Validator.isIn(data.kewarganegaraan, ['WNI', 'WNA'])) {
                errors.kewarganegaraan = 'kewarganegaraan harus berupa WNI atau WNA';
            }
        }

        if (Validator.isEmpty(data.ids_jenis_tinggal)) {
            errors.ids_jenis_tinggal = 'jenis tinggal wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_jenis_tinggal)) {
                errors.ids_jenis_tinggal = 'jenis tinggal harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_alat_transportasi)) {
            if (!Validator.isInt(data.ids_alat_transportasi)) {
                errors.ids_alat_transportasi = 'alat transportasi harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_sktm)) {
            if (!Validator.isInt(data.ids_sktm)) {
                errors.ids_sktm = 'sktm harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.terima_kps)) {
            errors.terima_kps = 'terima kps wajib diisi';
        } else {
            if (!Validator.isIn(data.terima_kps, ['YA', 'TIDAK'])) {
                errors.terima_kps = 'terima kps harus berupa YA atau TIDAK';
            }
        }

        if (data.terima_kps == 'YA') {
            if (Validator.isEmpty(data.no_kps)) {
                errors.no_kps = 'no kps wajib diisi';
            } else {
                if (!Validator.isLength(data.no_kps, {
                        min: 1,
                        max: 50
                    })) {
                    errors.no_kps = 'no kps tidak boleh lebih dari 50 karakter';
                }
            }
        }

        if (Validator.isEmpty(data.ids_jenis_pendaftaran)) {
            errors.ids_jenis_pendaftaran = 'jenis pendaftaran wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_jenis_pendaftaran)) {
                errors.ids_jenis_pendaftaran = 'jenis pendaftaran harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.ids_jenis_pembiayaan)) {
            errors.ids_jenis_pembiayaan = 'jenis pembiayaan wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_jenis_pembiayaan)) {
                errors.ids_jenis_pembiayaan = 'jenis pembiayaan harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.ukuran_baju)) {
            errors.ukuran_baju = 'ukuran baju wajib diisi';
        } else {
            if (!Validator.isIn(data.ukuran_baju, ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'])) {
                errors.ukuran_baju = 'ukuran baju harus berupa S, M, L, XL, XXL atau XXXL';
            }
        }

        if (Validator.isEmpty(data.ukuran_jas)) {
            errors.ukuran_jas = 'ukuran jas wajib diisi';
        } else {
            if (!Validator.isIn(data.ukuran_jas, ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'])) {
                errors.ukuran_jas = 'ukuran jas harus berupa S, M, L, XL, XXL atau XXXL';
            }
        }
    } else if (method === 'PUT') {
        if (!Validator.isEmpty(data.idd_kelulusan)) {
            if (!Validator.isInt(data.idd_kelulusan)) {
                errors.idd_kelulusan = 'idd kelulusan harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.nik)) {
            if (data.kewarganegaraan == 'WNI') {
                if (!Validator.isLength(data.nik, {
                        min: 16,
                        max: 16
                    })) {
                    errors.nik = 'nik harus berupa 16 karakter';
                }
            } else {
                if (!Validator.isLength(data.nik, {
                        max: 9
                    })) {
                    errors.nik = 'passport tidak boleh lebih dari 9 karakter';
                }
            }
        }

        if (!Validator.isEmpty(data.jenis_kelamin)) {
            if (!Validator.isIn(data.jenis_kelamin, ['LAKI-LAKI', 'PEREMPUAN'])) {
                errors.jenis_kelamin = 'jenis kelamin harus berupa LAKI-LAKI atau PEREMPUAN';
            }
        }

        if (!Validator.isEmpty(data.tempat_lahir)) {
            if (!Validator.isLength(data.tempat_lahir, {
                    min: 3,
                    max: 50
                })) {
                errors.tempat_lahir = 'tempat lahir tidak boleh kurang dari 3 karakter atau lebih dari 50 karakter';
            }
        }

        if (!Validator.isEmpty(data.tgl_lahir)) {
            if (!Validator.isDate(data.tgl_lahir)) {
                errors.tgl_lahir = 'tanggal lahir harus berupa tanggal yang valid';
            }
        }

        if (!Validator.isEmpty(data.ids_agama)) {
            if (!Validator.isInt(data.ids_agama)) {
                errors.ids_agama = 'agama harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.kewarganegaraan)) {
            if (!Validator.isIn(data.kewarganegaraan, ['WNI', 'WNA'])) {
                errors.kewarganegaraan = 'kewarganegaraan harus berupa WNI atau WNA';
            }
        }

        if (!Validator.isEmpty(data.ids_jenis_tinggal)) {
            if (!Validator.isInt(data.ids_jenis_tinggal)) {
                errors.ids_jenis_tinggal = 'jenis tinggal harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_alat_transportasi)) {
            if (!Validator.isInt(data.ids_alat_transportasi)) {
                errors.ids_alat_transportasi = 'alat transportasi harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_sktm)) {
            if (!Validator.isInt(data.ids_sktm)) {
                errors.ids_sktm = 'sktm harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.terima_kps)) {
            if (!Validator.isIn(data.terima_kps, ['YA', 'TIDAK'])) {
                errors.terima_kps = 'terima kps harus berupa YA atau TIDAK';
            }
        }

        if (data.terima_kps == 'YA') {
            if (!Validator.isEmpty(data.no_kps)) {
                if (!Validator.isLength(data.no_kps, {
                        min: 1,
                        max: 50
                    })) {
                    errors.no_kps = 'no kps tidak boleh lebih dari 50 karakter';
                }
            }
        }

        if (!Validator.isEmpty(data.ids_jenis_pendaftaran)) {
            if (!Validator.isInt(data.ids_jenis_pendaftaran)) {
                errors.ids_jenis_pendaftaran = 'jenis pendaftaran harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_jenis_pembiayaan)) {
            if (!Validator.isInt(data.ids_jenis_pembiayaan)) {
                errors.ids_jenis_pembiayaan = 'jenis pembiayaan harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ukuran_baju)) {
            if (!Validator.isIn(data.ukuran_baju, ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'])) {
                errors.ukuran_baju = 'ukuran baju harus berupa S, M, L, XL, XXL atau XXXL';
            }
        }

        if (!Validator.isEmpty(data.ukuran_jas)) {
            if (!Validator.isIn(data.ukuran_jas, ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'])) {
                errors.ukuran_jas = 'ukuran jas harus berupa S, M, L, XL, XXL atau XXXL';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};