/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.id_event = !isEmpty(data.id_event) ? data.id_event : '';
    data.ids_kelas = !isEmpty(data.ids_kelas) ? data.ids_kelas : '';
    data.nama_kategori = !isEmpty(data.nama_kategori) ? data.nama_kategori : '';
    data.ukuran_min = !isEmpty(data.ukuran_min) ? data.ukuran_min : '';
    data.ukuran_maks = !isEmpty(data.ukuran_maks) ? data.ukuran_maks : '';
    data.uang = !isEmpty(data.uang) ? data.uang : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    // Validasi untuk method POST (Create)
    if (method === 'POST') {
        // Validasi field id_event (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.id_event)) {
            errors.id_event = 'id event tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.id_event)) {
                errors.id_event = 'id event tidak valid.';
            }
        }

        // Validasi field ids_kelas (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.ids_kelas)) {
            errors.ids_kelas = 'ids kelas tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.ids_kelas)) {
                errors.ids_kelas = 'ids kelas tidak valid.';
            }
        }

        // Validasi field nama_kategori (wajib diisi dan max 50 karakter)
        if (Validator.isEmpty(data.nama_kategori)) {
            errors.nama_kategori = 'nama kategori tidak boleh kosong.';
        } else {
            if (!Validator.isLength(data.nama_kategori, {
                    min: 1,
                    max: 50
                })) {
                errors.nama_kategori = 'nama kategori maksimal 50 karakter.';
            }
        }

        // Validasi field ukuran_min (wajib diisi dan harus decimal)
        if (Validator.isEmpty(data.ukuran_min)) {
            errors.ukuran_min = 'ukuran minimum tidak boleh kosong.';
        } else {
            if (!Validator.isDecimal(data.ukuran_min)) {
                errors.ukuran_min = 'ukuran minimum harus berupa angka.';
            }
        }

        // Validasi field ukuran_maks (wajib diisi dan harus decimal)
        if (Validator.isEmpty(data.ukuran_maks)) {
            errors.ukuran_maks = 'ukuran maksimal tidak boleh kosong.';
        } else {
            if (!Validator.isDecimal(data.ukuran_maks)) {
                errors.ukuran_maks = 'ukuran maksimal harus berupa angka.';
            }
        }

        // Validasi ukuran_min tidak boleh lebih besar dari ukuran_maks
        if (!Validator.isEmpty(data.ukuran_min) && !Validator.isEmpty(data.ukuran_maks)) {
            if (parseFloat(data.ukuran_min) > parseFloat(data.ukuran_maks)) {
                errors.ukuran_min = 'ukuran minimum tidak boleh lebih besar dari ukuran maksimal.';
            }
        }

        // Validasi field uang (wajib diisi dan harus numeric)
        if (Validator.isEmpty(data.uang)) {
            errors.uang = 'uang tidak boleh kosong.';
        } else {
            if (!Validator.isFloat(data.uang) || parseFloat(data.uang) < 0) {
                errors.uang = 'uang harus berupa angka positif.';
            }
        }

        // Validasi field status (wajib diisi dan harus enum 'YA' atau 'TIDAK')
        if (Validator.isEmpty(data.status)) {
            errors.status = 'status tidak boleh kosong.';
        } else {
            if (!Validator.isIn(data.status, ['YA', 'TIDAK'])) {
                errors.status = 'status tidak valid. harus YA atau TIDAK.';
            }
        }
    } else {
        // Validasi untuk method lain (PUT/PATCH untuk Update)
        // Field bersifat opsional, tapi jika diisi harus valid

        // Validasi id_event jika diisi
        if (!Validator.isEmpty(data.id_event)) {
            if (!Validator.isInt(data.id_event)) {
                errors.id_event = 'id event tidak valid.';
            }
        }

        // Validasi ids_kelas jika diisi
        if (!Validator.isEmpty(data.ids_kelas)) {
            if (!Validator.isInt(data.ids_kelas)) {
                errors.ids_kelas = 'ids kelas tidak valid.';
            }
        }

        // Validasi nama_kategori jika diisi
        if (!Validator.isEmpty(data.nama_kategori)) {
            if (!Validator.isLength(data.nama_kategori, {
                    min: 1,
                    max: 50
                })) {
                errors.nama_kategori = 'nama kategori maksimal 50 karakter.';
            }
        }

        // Validasi ukuran_min jika diisi
        if (!Validator.isEmpty(data.ukuran_min)) {
            if (!Validator.isDecimal(data.ukuran_min)) {
                errors.ukuran_min = 'ukuran minimum harus berupa angka.';
            }
        }

        // Validasi ukuran_maks jika diisi
        if (!Validator.isEmpty(data.ukuran_maks)) {
            if (!Validator.isDecimal(data.ukuran_maks)) {
                errors.ukuran_maks = 'ukuran maksimal harus berupa angka.';
            }
        }

        // Validasi ukuran_min tidak boleh lebih besar dari ukuran_maks
        if (!Validator.isEmpty(data.ukuran_min) && !Validator.isEmpty(data.ukuran_maks)) {
            if (parseFloat(data.ukuran_min) > parseFloat(data.ukuran_maks)) {
                errors.ukuran_min = 'ukuran minimum tidak boleh lebih besar dari ukuran maksimal.';
            }
        }

        // Validasi uang jika diisi
        if (!Validator.isEmpty(data.uang)) {
            if (!Validator.isFloat(data.uang) || parseFloat(data.uang) < 0) {
                errors.uang = 'uang harus berupa angka positif.';
            }
        }

        // Validasi status jika diisi
        if (!Validator.isEmpty(data.status)) {
            if (!Validator.isIn(data.status, ['YA', 'TIDAK'])) {
                errors.status = 'status tidak valid. harus YA atau TIDAK.';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};