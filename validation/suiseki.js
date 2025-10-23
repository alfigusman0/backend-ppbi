/* Libraries */
const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.id_profile = !isEmpty(data.id_profile) ? data.id_profile : '';
    data.ids_jenis_suiseki = !isEmpty(data.ids_jenis_suiseki) ? data.ids_jenis_suiseki : '';
    data.ids_kelas = !isEmpty(data.ids_kelas) ? data.ids_kelas : '';
    data.ukuran = !isEmpty(data.ukuran) ? data.ukuran : '';
    data.foto = !isEmpty(data.foto) ? data.foto : '';

    // Validasi untuk method POST (Create)
    if (method === 'POST') {
        // Validasi field id_profile (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.id_profile)) {
            errors.id_profile = 'id profile tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.id_profile)) {
                errors.id_profile = 'id profile tidak valid.';
            }
        }

        // Validasi field ids_jenis_suiseki (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.ids_jenis_suiseki)) {
            errors.ids_jenis_suiseki = 'ids jenis suiseki tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.ids_jenis_suiseki)) {
                errors.ids_jenis_suiseki = 'ids jenis suiseki tidak valid.';
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

        // Validasi field ukuran (opsional, tapi jika diisi harus decimal)
        if (!Validator.isEmpty(data.ukuran)) {
            if (!Validator.isDecimal(data.ukuran)) {
                errors.ukuran = 'ukuran harus berupa angka.';
            }
        }

        // Validasi field foto (wajib diisi dan harus URL atau #)
        if (Validator.isEmpty(data.foto)) {
            errors.foto = 'foto tidak boleh kosong.';
        } else {
            if (data.foto !== '#') {
                if (!Validator.isURL(data.foto, {
                        protocols: ['http', 'https'],
                        require_protocol: true
                    })) {
                    errors.foto = 'foto harus berupa URL (http/https) atau #.';
                }
            }
        }
    } else {
        // Validasi untuk method lain (PUT/PATCH untuk Update)
        // Field bersifat opsional, tapi jika diisi harus valid

        // Validasi id_profile jika diisi
        if (!Validator.isEmpty(data.id_profile)) {
            if (!Validator.isInt(data.id_profile)) {
                errors.id_profile = 'id profile tidak valid.';
            }
        }

        // Validasi ids_jenis_suiseki jika diisi
        if (!Validator.isEmpty(data.ids_jenis_suiseki)) {
            if (!Validator.isInt(data.ids_jenis_suiseki)) {
                errors.ids_jenis_suiseki = 'ids jenis suiseki tidak valid.';
            }
        }

        // Validasi ids_kelas jika diisi
        if (!Validator.isEmpty(data.ids_kelas)) {
            if (!Validator.isInt(data.ids_kelas)) {
                errors.ids_kelas = 'ids kelas tidak valid.';
            }
        }

        // Validasi ukuran jika diisi
        if (!Validator.isEmpty(data.ukuran)) {
            if (!Validator.isDecimal(data.ukuran)) {
                errors.ukuran = 'ukuran harus berupa angka.';
            }
        }

        // Validasi foto jika diisi
        if (!Validator.isEmpty(data.foto)) {
            if (data.foto !== '#') {
                if (!Validator.isURL(data.foto, {
                        protocols: ['http', 'https'],
                        require_protocol: true
                    })) {
                    errors.foto = 'foto harus berupa URL (http/https) atau #.';
                }
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};