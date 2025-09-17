/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.id_user = !isEmpty(data.id_user) ? data.id_user : '';
    data.nomor_peserta = !isEmpty(data.nomor_peserta) ? data.nomor_peserta : '';
    data.nim = !isEmpty(data.nim) ? data.nim : '';
    data.nama = !isEmpty(data.nama) ? data.nama : '';
    data.kode_jurusan = !isEmpty(data.kode_jurusan) ? data.kode_jurusan : '';
    data.ids_konsentrasi = !isEmpty(data.ids_konsentrasi) ? data.ids_konsentrasi : '';
    data.ids_jalur_masuk = !isEmpty(data.ids_jalur_masuk) ? data.ids_jalur_masuk : '';
    data.ids_tipe_ujian = !isEmpty(data.ids_tipe_ujian) ? data.ids_tipe_ujian : '';
    data.ids_konsentrasi = !isEmpty(data.ids_konsentrasi) ? data.ids_konsentrasi : '';
    data.tahun = !isEmpty(data.tahun) ? data.tahun : '';
    data.daftar = !isEmpty(data.daftar) ? data.daftar : '';
    data.tgl_daftar = !isEmpty(data.tgl_daftar) ? data.tgl_daftar : '';
    data.submit = !isEmpty(data.submit) ? data.submit : '';
    data.tgl_submit = !isEmpty(data.tgl_submit) ? data.tgl_submit : '';
    data.pembayaran = !isEmpty(data.pembayaran) ? data.pembayaran : '';
    data.tgl_pembayaran = !isEmpty(data.tgl_pembayaran) ? data.tgl_pembayaran : '';
    data.ket_pembayaran = !isEmpty(data.ket_pembayaran) ? data.ket_pembayaran : '';
    data.pemberkasan = !isEmpty(data.pemberkasan) ? data.pemberkasan : '';
    data.tgl_pemberkasan = !isEmpty(data.tgl_pemberkasan) ? data.tgl_pemberkasan : '';
    data.kelas = !isEmpty(data.kelas) ? data.kelas : '';

    if (method === 'POST') {
        if (!Validator.isEmpty(data.id_user)) {
            if (!Validator.isInt(data.id_user)) {
                errors.id_user = 'id_user harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.nomor_peserta)) {
            errors.nomor_peserta = 'nomor peserta wajib diisi';
        } else {
            if (!Validator.isLength(data.nomor_peserta, {
                    min: 10,
                    max: 16
                })) {
                errors.nomor_peserta = 'nomor peserta tidak boleh kurang dari 10 karakter atau lebih dari 16 karakter.';
            }
        }

        if (!Validator.isEmpty(data.nim)) {
            if (!Validator.isLength(data.nim, {
                    min: 10,
                    max: 16
                })) {
                errors.nim = 'nim tidak boleh kurang dari 10 karakter atau lebih dari 16 karakter.';
            }
        }

        if (Validator.isEmpty(data.nama)) {
            errors.nama = 'nama wajib diisi';
        } else {
            if (!Validator.isLength(data.nama, {
                    min: 2,
                    max: 100
                })) {
                errors.nama = 'nama tidak boleh kurang dari 2 karakter atau lebih dari 100 karakter.';
            }
        }

        if (Validator.isEmpty(data.kode_jurusan)) {
            errors.kode_jurusan = 'kode jurusan wajib diisi';
        } else {
            if (!Validator.isLength(data.kode_jurusan, {
                    min: 1,
                    max: 16
                })) {
                errors.kode_jurusan = 'kode jurusan tidak boleh kurang dari 1 karakter atau lebih dari 16 karakter.';
            }
        }

        if (!Validator.isEmpty(data.ids_konsentrasi)) {
            if (!Validator.isInt(data.ids_konsentrasi)) {
                errors.ids_konsentrasi = 'ids konsentrasi harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.ids_jalur_masuk)) {
            errors.ids_jalur_masuk = 'ids jalur masuk wajib diisi';
        } else {
            if (!Validator.isInt(data.ids_jalur_masuk)) {
                errors.ids_jalur_masuk = 'ids jalur masuk harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_tipe_ujian)) {
            if (!Validator.isInt(data.ids_tipe_ujian)) {
                errors.ids_tipe_ujian = 'ids tipe ujian harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.tahun)) {
            errors.tahun = 'tahun wajib diisi';
        } else {
            if (!Validator.isLength(data.tahun, {
                    min: 4,
                    max: 4
                })) {
                errors.tahun = 'tahun wajib diisi dengan 4 karakter.';
            }
        }

        if (Validator.isEmpty(data.daftar)) {
            errors.daftar = 'daftar wajib diisi';
        } else {
            if (!Validator.isIn(data.daftar, ['BELUM', 'SUDAH'])) {
                errors.daftar = 'daftar boleh diisi dengan BELUM atau SUDAH';
            }
        }

        if (!Validator.isEmpty(data.tgl_daftar)) {
            // Additional regex for format YYYY-MM-DD HH:mm:ss
            const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
            if (!regex.test(data.tgl_daftar)) {
                errors.tgl_daftar = 'tgl daftar harus berformat YYYY-MM-DD HH:mm:ss.';
            }
        }

        if (Validator.isEmpty(data.submit)) {
            errors.submit = 'submit wajib diisi';
        } else {
            if (!Validator.isIn(data.submit, ['BELUM', 'SUDAH'])) {
                errors.submit = 'submit boleh diisi dengan BELUM atau SUDAH';
            }
        }

        if (!Validator.isEmpty(data.tgl_submit)) {
            // Additional regex for format YYYY-MM-DD HH:mm:ss
            const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
            if (!regex.test(data.tgl_submit)) {
                errors.tgl_submit = 'tgl submit harus berformat YYYY-MM-DD HH:mm:ss.';
            }
        }

        if (Validator.isEmpty(data.pembayaran)) {
            errors.pembayaran = 'pembayaran wajib diisi';
        } else {
            if (!Validator.isIn(data.pembayaran, ['BELUM', 'SUDAH'])) {
                errors.pembayaran = 'pembayaran boleh diisi dengan BELUM atau SUDAH';
            }
        }

        if (!Validator.isEmpty(data.tgl_pembayaran)) {
            // Additional regex for format YYYY-MM-DD HH:mm:ss
            const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
            if (!regex.test(data.tgl_pembayaran)) {
                errors.tgl_pembayaran = 'tgl pembayaran harus berformat YYYY-MM-DD HH:mm:ss.';
            }
        }

        if (!Validator.isEmpty(data.ket_pembayaran)) {
            if (!Validator.isLength(data.ket_pembayaran, {
                    min: 1,
                    max: 255
                })) {
                errors.ket_pembayaran = 'ket_pembayaran tidak boleh kurang dari 1 karakter atau lebih dari 255 karakter.';
            }
        }

        if (Validator.isEmpty(data.pemberkasan)) {
            errors.pemberkasan = 'pemberkasan wajib diisi';
        } else {
            if (!Validator.isIn(data.pemberkasan, ['BELUM', 'SUDAH'])) {
                errors.pemberkasan = 'pemberkasan boleh diisi dengan BELUM atau SUDAH';
            }
        }

        if (!Validator.isEmpty(data.tgl_pemberkasan)) {
            // Additional regex for format YYYY-MM-DD HH:mm:ss
            const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
            if (!regex.test(data.tgl_pemberkasan)) {
                errors.tgl_pemberkasan = 'tgl pemberkasan harus berformat YYYY-MM-DD HH:mm:ss.';
            }
        }

        if (!Validator.isEmpty(data.kelas)) {
            if (!Validator.isLength(data.kelas, {
                    min: 1,
                    max: 2
                })) {
                errors.kelas = 'kelas tidak boleh kurang dari 1 karakter atau lebih dari 2 karakter.';
            }
        }
    } else if (method === 'PUT') {
        if (!Validator.isEmpty(data.id_user)) {
            if (!Validator.isInt(data.id_user)) {
                errors.id_user = 'id_user harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.nomor_peserta)) {
            if (!Validator.isLength(data.nomor_peserta, {
                    min: 10,
                    max: 16
                })) {
                errors.nomor_peserta = 'nomor peserta tidak boleh kurang dari 10 karakter atau lebih dari 16 karakter.';
            }
        }

        if (!Validator.isEmpty(data.nim)) {
            if (!Validator.isLength(data.nim, {
                    min: 10,
                    max: 16
                })) {
                errors.nim = 'nim tidak boleh kurang dari 10 karakter atau lebih dari 16 karakter.';
            }
        }

        if (!Validator.isEmpty(data.nama)) {
            if (!Validator.isLength(data.nama, {
                    min: 2,
                    max: 100
                })) {
                errors.nama = 'nama tidak boleh kurang dari 2 karakter atau lebih dari 100 karakter.';
            }
        }

        if (!Validator.isEmpty(data.kode_jurusan)) {
            if (!Validator.isLength(data.kode_jurusan, {
                    min: 1,
                    max: 16
                })) {
                errors.kode_jurusan = 'kode jurusan tidak boleh kurang dari 1 karakter atau lebih dari 16 karakter.';
            }
        }

        if (!Validator.isEmpty(data.ids_konsentrasi)) {
            if (!Validator.isInt(data.ids_konsentrasi)) {
                errors.ids_konsentrasi = 'ids konsentrasi harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_jalur_masuk)) {
            if (!Validator.isInt(data.ids_jalur_masuk)) {
                errors.ids_jalur_masuk = 'ids jalur masuk harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.ids_tipe_ujian)) {
            if (!Validator.isInt(data.ids_tipe_ujian)) {
                errors.ids_tipe_ujian = 'ids tipe ujian harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.tahun)) {
            if (!Validator.isLength(data.tahun, {
                    min: 4,
                    max: 4
                })) {
                errors.tahun = 'tahun wajib diisi dengan 4 karakter.';
            }
        }

        if (!Validator.isEmpty(data.daftar)) {
            if (!Validator.isIn(data.daftar, ['BELUM', 'SUDAH'])) {
                errors.daftar = 'daftar boleh diisi dengan BELUM atau SUDAH';
            }
        }

        if (!Validator.isEmpty(data.tgl_daftar)) {
            // Additional regex for format YYYY-MM-DD HH:mm:ss
            const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
            if (!regex.test(data.tgl_daftar)) {
                errors.tgl_daftar = 'tgl daftar harus berformat YYYY-MM-DD HH:mm:ss.';
            }
        }

        if (!Validator.isEmpty(data.submit)) {
            if (!Validator.isIn(data.submit, ['BELUM', 'SUDAH'])) {
                errors.submit = 'submit boleh diisi dengan BELUM atau SUDAH';
            }
        }

        if (!Validator.isEmpty(data.tgl_submit)) {
            // Additional regex for format YYYY-MM-DD HH:mm:ss
            const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
            if (!regex.test(data.tgl_submit)) {
                errors.tgl_submit = 'tgl submit harus berformat YYYY-MM-DD HH:mm:ss.';
            }
        }

        if (!Validator.isEmpty(data.pembayaran)) {
            if (!Validator.isIn(data.pembayaran, ['BELUM', 'SUDAH'])) {
                errors.pembayaran = 'pembayaran boleh diisi dengan BELUM atau SUDAH';
            }
        }

        if (!Validator.isEmpty(data.tgl_pembayaran)) {
            // Additional regex for format YYYY-MM-DD HH:mm:ss
            const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
            if (!regex.test(data.tgl_pembayaran)) {
                errors.tgl_pembayaran = 'tgl pembayaran harus berformat YYYY-MM-DD HH:mm:ss.';
            }
        }

        if (!Validator.isEmpty(data.ket_pembayaran)) {
            if (!Validator.isLength(data.ket_pembayaran, {
                    min: 1,
                    max: 255
                })) {
                errors.ket_pembayaran = 'ket_pembayaran tidak boleh kurang dari 1 karakter atau lebih dari 255 karakter.';
            }
        }

        if (!Validator.isEmpty(data.pemberkasan)) {
            if (!Validator.isIn(data.pemberkasan, ['BELUM', 'SUDAH'])) {
                errors.pemberkasan = 'pemberkasan boleh diisi dengan BELUM atau SUDAH';
            }
        }

        if (!Validator.isEmpty(data.tgl_pemberkasan)) {
            // Additional regex for format YYYY-MM-DD HH:mm:ss
            const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
            if (!regex.test(data.tgl_pemberkasan)) {
                errors.tgl_pemberkasan = 'tgl pemberkasan harus berformat YYYY-MM-DD HH:mm:ss.';
            }
        }

        if (!Validator.isEmpty(data.kelas)) {
            if (!Validator.isLength(data.kelas, {
                    min: 1,
                    max: 2
                })) {
                errors.kelas = 'kelas tidak boleh kurang dari 1 karakter atau lebih dari 2 karakter.';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};