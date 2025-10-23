/* Libraries */
const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.nama_lengkap = !isEmpty(data.nama_lengkap) ? data.nama_lengkap : '';
    data.jenis_kelamin = !isEmpty(data.jenis_kelamin) ? data.jenis_kelamin : '';
    data.ids_kelurahan = !isEmpty(data.ids_kelurahan) ? data.ids_kelurahan : '';
    data.rw = !isEmpty(data.rw) ? data.rw : '';
    data.rt = !isEmpty(data.rt) ? data.rt : '';
    data.alamat = !isEmpty(data.alamat) ? data.alamat : '';
    data.nmr_tlpn = !isEmpty(data.nmr_tlpn) ? data.nmr_tlpn : '';
    data.foto = !isEmpty(data.foto) ? data.foto : '';

    // Validasi untuk method POST (Create)
    if (method === 'POST') {
        // Validasi field nama_lengkap (wajib diisi dan max 255 karakter)
        if (Validator.isEmpty(data.nama_lengkap)) {
            errors.nama_lengkap = 'nama lengkap tidak boleh kosong.';
        } else {
            if (!Validator.isLength(data.nama_lengkap, {
                    min: 3,
                    max: 255
                })) {
                errors.nama_lengkap = 'nama lengkap harus 3-255 karakter.';
            }
        }

        // Validasi field jenis_kelamin (wajib diisi dan harus enum)
        if (Validator.isEmpty(data.jenis_kelamin)) {
            errors.jenis_kelamin = 'jenis kelamin tidak boleh kosong.';
        } else {
            if (!Validator.isIn(data.jenis_kelamin, ['LAKI-LAKI', 'PEREMPUAN'])) {
                errors.jenis_kelamin = 'jenis kelamin tidak valid. harus LAKI-LAKI atau PEREMPUAN.';
            }
        }

        // Validasi field ids_kelurahan (opsional, tapi jika diisi harus integer)
        if (!Validator.isEmpty(data.ids_kelurahan)) {
            if (!Validator.isInt(data.ids_kelurahan)) {
                errors.ids_kelurahan = 'ids kelurahan tidak valid.';
            }
        }

        // Validasi field rw (opsional, tapi jika diisi max 5 karakter)
        if (!Validator.isEmpty(data.rw)) {
            if (!Validator.isLength(data.rw, {
                    min: 1,
                    max: 5
                })) {
                errors.rw = 'rw maksimal 5 karakter.';
            }
        }

        // Validasi field rt (opsional, tapi jika diisi max 5 karakter)
        if (!Validator.isEmpty(data.rt)) {
            if (!Validator.isLength(data.rt, {
                    min: 1,
                    max: 5
                })) {
                errors.rt = 'rt maksimal 5 karakter.';
            }
        }

        // Validasi field alamat (opsional, tipe text)
        // Tidak ada validasi length khusus karena tipe text

        // Validasi field nmr_tlpn (opsional, tapi jika diisi max 20 karakter)
        if (!Validator.isEmpty(data.nmr_tlpn)) {
            if (!Validator.isLength(data.nmr_tlpn, {
                    min: 10,
                    max: 20
                })) {
                errors.nmr_tlpn = 'nomor telepon harus 10-20 karakter.';
            }
        }

        // Validasi field foto (opsional, tapi jika diisi harus URL atau #)
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
    } else {
        // Validasi untuk method lain (PUT/PATCH untuk Update)
        // Field bersifat opsional, tapi jika diisi harus valid

        // Validasi nama_lengkap jika diisi
        if (!Validator.isEmpty(data.nama_lengkap)) {
            if (!Validator.isLength(data.nama_lengkap, {
                    min: 3,
                    max: 255
                })) {
                errors.nama_lengkap = 'nama lengkap harus 3-255 karakter.';
            }
        }

        // Validasi jenis_kelamin jika diisi
        if (!Validator.isEmpty(data.jenis_kelamin)) {
            if (!Validator.isIn(data.jenis_kelamin, ['LAKI-LAKI', 'PEREMPUAN'])) {
                errors.jenis_kelamin = 'jenis kelamin tidak valid. harus LAKI-LAKI atau PEREMPUAN.';
            }
        }

        // Validasi ids_kelurahan jika diisi
        if (!Validator.isEmpty(data.ids_kelurahan)) {
            if (!Validator.isInt(data.ids_kelurahan)) {
                errors.ids_kelurahan = 'ids kelurahan tidak valid.';
            }
        }

        // Validasi rw jika diisi
        if (!Validator.isEmpty(data.rw)) {
            if (!Validator.isLength(data.rw, {
                    min: 1,
                    max: 5
                })) {
                errors.rw = 'rw maksimal 5 karakter.';
            }
        }

        // Validasi rt jika diisi
        if (!Validator.isEmpty(data.rt)) {
            if (!Validator.isLength(data.rt, {
                    min: 1,
                    max: 5
                })) {
                errors.rt = 'rt maksimal 5 karakter.';
            }
        }

        // Validasi nmr_tlpn jika diisi
        if (!Validator.isEmpty(data.nmr_tlpn)) {
            if (!Validator.isLength(data.nmr_tlpn, {
                    min: 10,
                    max: 20
                })) {
                errors.nmr_tlpn = 'nomor telepon harus 10-20 karakter.';
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