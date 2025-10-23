/* Libraries */
const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.pengantar_nama = !isEmpty(data.pengantar_nama) ? data.pengantar_nama : '';
    data.pengantar_alamat = !isEmpty(data.pengantar_alamat) ? data.pengantar_alamat : '';
    data.pengantar_handphone = !isEmpty(data.pengantar_handphone) ? data.pengantar_handphone : '';
    data.pengantar_fotoktp = !isEmpty(data.pengantar_fotoktp) ? data.pengantar_fotoktp : '';
    data.pengantar_fotosuratpernyataan = !isEmpty(data.pengantar_fotosuratpernyataan) ? data.pengantar_fotosuratpernyataan : '';

    // Validasi untuk method POST (Create)
    if (method === 'POST') {
        // Validasi field pengantar_nama (wajib diisi dan max 150 karakter)
        if (Validator.isEmpty(data.pengantar_nama)) {
            errors.pengantar_nama = 'nama pengantar tidak boleh kosong.';
        } else {
            if (!Validator.isLength(data.pengantar_nama, {
                    min: 1,
                    max: 150
                })) {
                errors.pengantar_nama = 'nama pengantar maksimal 150 karakter.';
            }
        }

        // Validasi field pengantar_alamat (wajib diisi)
        if (Validator.isEmpty(data.pengantar_alamat)) {
            errors.pengantar_alamat = 'alamat pengantar tidak boleh kosong.';
        }

        // Validasi field pengantar_handphone (wajib diisi dan max 20 karakter)
        if (Validator.isEmpty(data.pengantar_handphone)) {
            errors.pengantar_handphone = 'nomor handphone tidak boleh kosong.';
        } else {
            if (!Validator.isLength(data.pengantar_handphone, {
                    min: 1,
                    max: 20
                })) {
                errors.pengantar_handphone = 'nomor handphone maksimal 20 karakter.';
            }
            // Validasi format nomor handphone (hanya angka dan karakter +-)
            if (!Validator.isLength(data.pengantar_handphone, {
                    min: 10
                })) {
                errors.pengantar_handphone = 'nomor handphone minimal 10 karakter.';
            }
        }

        // Validasi field pengantar_fotoktp (opsional, tapi jika diisi harus URL atau #)
        if (!Validator.isEmpty(data.pengantar_fotoktp)) {
            if (data.pengantar_fotoktp !== '#') {
                if (!Validator.isURL(data.pengantar_fotoktp, {
                        protocols: ['http', 'https'],
                        require_protocol: true
                    })) {
                    errors.pengantar_fotoktp = 'foto ktp harus berupa URL (http/https) atau #.';
                }
            }
        }

        // Validasi field pengantar_fotosuratpernyataan (opsional, tapi jika diisi harus URL atau #)
        if (!Validator.isEmpty(data.pengantar_fotosuratpernyataan)) {
            if (data.pengantar_fotosuratpernyataan !== '#') {
                if (!Validator.isURL(data.pengantar_fotosuratpernyataan, {
                        protocols: ['http', 'https'],
                        require_protocol: true
                    })) {
                    errors.pengantar_fotosuratpernyataan = 'foto surat pernyataan harus berupa URL (http/https) atau #.';
                }
            }
        }
    } else {
        // Validasi untuk method lain (PUT/PATCH untuk Update)
        // Field bersifat opsional, tapi jika diisi harus valid

        // Validasi pengantar_nama jika diisi
        if (!Validator.isEmpty(data.pengantar_nama)) {
            if (!Validator.isLength(data.pengantar_nama, {
                    min: 1,
                    max: 150
                })) {
                errors.pengantar_nama = 'nama pengantar maksimal 150 karakter.';
            }
        }

        // Validasi pengantar_handphone jika diisi
        if (!Validator.isEmpty(data.pengantar_handphone)) {
            if (!Validator.isLength(data.pengantar_handphone, {
                    min: 10,
                    max: 20
                })) {
                errors.pengantar_handphone = 'nomor handphone harus 10-20 karakter.';
            }
        }

        // Validasi pengantar_fotoktp jika diisi
        if (!Validator.isEmpty(data.pengantar_fotoktp)) {
            if (data.pengantar_fotoktp !== '#') {
                if (!Validator.isURL(data.pengantar_fotoktp, {
                        protocols: ['http', 'https'],
                        require_protocol: true
                    })) {
                    errors.pengantar_fotoktp = 'foto ktp harus berupa URL (http/https) atau #.';
                }
            }
        }

        // Validasi pengantar_fotosuratpernyataan jika diisi
        if (!Validator.isEmpty(data.pengantar_fotosuratpernyataan)) {
            if (data.pengantar_fotosuratpernyataan !== '#') {
                if (!Validator.isURL(data.pengantar_fotosuratpernyataan, {
                        protocols: ['http', 'https'],
                        require_protocol: true
                    })) {
                    errors.pengantar_fotosuratpernyataan = 'foto surat pernyataan harus berupa URL (http/https) atau #.';
                }
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};