/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
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

    // Validasi untuk method POST (Create)
    if (method === 'POST') {
        // Validasi field ids_cabang (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.ids_cabang)) {
            errors.ids_cabang = 'ids cabang tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.ids_cabang)) {
                errors.ids_cabang = 'ids cabang tidak valid.';
            }
        }

        // Validasi field nama_acara (wajib diisi dan max 255 karakter)
        if (Validator.isEmpty(data.nama_acara)) {
            errors.nama_acara = 'nama acara tidak boleh kosong.';
        } else {
            if (!Validator.isLength(data.nama_acara, {
                    min: 1,
                    max: 255
                })) {
                errors.nama_acara = 'nama acara maksimal 255 karakter.';
            }
        }

        // Validasi field slug_event (opsional, tapi jika diisi max 255 karakter dan unique)
        if (!Validator.isEmpty(data.slug_event)) {
            if (!Validator.isLength(data.slug_event, {
                    min: 1,
                    max: 255
                })) {
                errors.slug_event = 'slug event maksimal 255 karakter.';
            }
            // Validasi format slug (hanya huruf kecil, angka, underscore, dan dash)
            if (!/^[a-z0-9_-]+$/.test(data.slug_event)) {
                errors.slug_event = 'slug event hanya boleh mengandung huruf kecil, angka, underscore, dan dash.';
            }
        }

        // Validasi field proposal (wajib diisi dan harus URL atau #)
        if (Validator.isEmpty(data.proposal)) {
            errors.proposal = 'proposal tidak boleh kosong.';
        } else {
            if (data.proposal !== '#') {
                if (!Validator.isURL(data.proposal, {
                        protocols: ['http', 'https'],
                        require_protocol: true
                    })) {
                    errors.proposal = 'proposal harus berupa URL (http/https) atau #.';
                }
            }
        }


        // Validasi field tgl_awal_acara (opsional, tapi jika diisi harus format date YYYY-MM-DD)
        if (!Validator.isEmpty(data.tgl_awal_acara)) {
            if (!Validator.isISO8601(data.tgl_awal_acara)) {
                errors.tgl_awal_acara = 'tanggal awal acara harus format tanggal YYYY-MM-DD.';
            }
        }

        // Validasi field tgl_akhir_acara (opsional, tapi jika diisi harus format date YYYY-MM-DD)
        if (!Validator.isEmpty(data.tgl_akhir_acara)) {
            if (!Validator.isISO8601(data.tgl_akhir_acara)) {
                errors.tgl_akhir_acara = 'tanggal akhir acara harus format tanggal YYYY-MM-DD.';
            }
        }

        // Validasi tgl_awal_acara tidak boleh lebih besar dari tgl_akhir_acara
        if (!Validator.isEmpty(data.tgl_awal_acara) && !Validator.isEmpty(data.tgl_akhir_acara)) {
            if (new Date(data.tgl_awal_acara) > new Date(data.tgl_akhir_acara)) {
                errors.tgl_awal_acara = 'tanggal awal acara tidak boleh lebih besar dari tanggal akhir acara.';
            }
        }

        // Validasi field ids_kelurahan (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.ids_kelurahan)) {
            errors.ids_kelurahan = 'ids kelurahan tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.ids_kelurahan)) {
                errors.ids_kelurahan = 'ids kelurahan tidak valid.';
            }
        }

        // Validasi field rw (wajib diisi dan max 5 karakter)
        if (Validator.isEmpty(data.rw)) {
            errors.rw = 'rw tidak boleh kosong.';
        } else {
            if (!Validator.isLength(data.rw, {
                    min: 1,
                    max: 5
                })) {
                errors.rw = 'rw maksimal 5 karakter.';
            }
        }

        // Validasi field rt (wajib diisi dan max 5 karakter)
        if (Validator.isEmpty(data.rt)) {
            errors.rt = 'rt tidak boleh kosong.';
        } else {
            if (!Validator.isLength(data.rt, {
                    min: 1,
                    max: 5
                })) {
                errors.rt = 'rt maksimal 5 karakter.';
            }
        }

        // Validasi field alamat (wajib diisi)
        if (Validator.isEmpty(data.alamat)) {
            errors.alamat = 'alamat tidak boleh kosong.';
        }

        // Validasi field poster (opsional, tapi jika diisi harus URL atau #)
        if (!Validator.isEmpty(data.poster)) {
            if (data.poster !== '#') {
                if (!Validator.isURL(data.poster, {
                        protocols: ['http', 'https'],
                        require_protocol: true
                    })) {
                    errors.poster = 'poster harus berupa URL (http/https) atau #.';
                }
            }
        }

        // Validasi field bukti_bayar (wajib diisi dan harus URL atau #)
        if (Validator.isEmpty(data.bukti_bayar)) {
            errors.bukti_bayar = 'bukti bayar tidak boleh kosong.';
        } else {
            if (data.bukti_bayar !== '#') {
                if (!Validator.isURL(data.bukti_bayar, {
                        protocols: ['http', 'https'],
                        require_protocol: true
                    })) {
                    errors.bukti_bayar = 'bukti bayar harus berupa URL (http/https) atau #.';
                }
            }
        }

        // Validasi field jenis (opsional, tapi jika diisi harus enum)
        if (!Validator.isEmpty(data.jenis)) {
            if (!Validator.isIn(data.jenis, ['Suiseki', 'Bonsai'])) {
                errors.jenis = 'jenis tidak valid. harus Suiseki atau Bonsai.';
            }
        }

        // Validasi field status (wajib diisi dan harus enum)
        if (Validator.isEmpty(data.status)) {
            errors.status = 'status tidak boleh kosong.';
        } else {
            const validStatus = ['BELUM BAYAR', 'MENUNGGU', 'DITERIMA', 'DIPENDING', 'DISESUAIKAN', 'SELESAI'];
            if (!Validator.isIn(data.status, validStatus)) {
                errors.status = `status tidak valid. harus salah satu dari: ${validStatus.join(', ')}.`;
            }
        }
    } else {
        // Validasi untuk method lain (PUT/PATCH untuk Update)
        // Field bersifat opsional, tapi jika diisi harus valid

        // Validasi ids_cabang jika diisi
        if (!Validator.isEmpty(data.ids_cabang)) {
            if (!Validator.isInt(data.ids_cabang)) {
                errors.ids_cabang = 'ids cabang tidak valid.';
            }
        }

        // Validasi nama_acara jika diisi
        if (!Validator.isEmpty(data.nama_acara)) {
            if (!Validator.isLength(data.nama_acara, {
                    min: 1,
                    max: 255
                })) {
                errors.nama_acara = 'nama acara maksimal 255 karakter.';
            }
        }

        // Validasi slug_event jika diisi
        if (!Validator.isEmpty(data.slug_event)) {
            if (!Validator.isLength(data.slug_event, {
                    min: 1,
                    max: 255
                })) {
                errors.slug_event = 'slug event maksimal 255 karakter.';
            }
            if (!/^[a-z0-9_-]+$/.test(data.slug_event)) {
                errors.slug_event = 'slug event hanya boleh mengandung huruf kecil, angka, underscore, dan dash.';
            }
        }

        // Validasi proposal jika diisi
        if (!Validator.isEmpty(data.proposal)) {
            if (data.proposal !== '#') {
                if (!Validator.isURL(data.proposal, {
                        protocols: ['http', 'https'],
                        require_protocol: true
                    })) {
                    errors.proposal = 'proposal harus berupa URL (http/https) atau #.';
                }
            }
        }

        // Validasi tgl_awal_acara jika diisi
        if (!Validator.isEmpty(data.tgl_awal_acara)) {
            if (!Validator.isISO8601(data.tgl_awal_acara)) {
                errors.tgl_awal_acara = 'tanggal awal acara harus format tanggal YYYY-MM-DD.';
            }
        }

        // Validasi tgl_akhir_acara jika diisi
        if (!Validator.isEmpty(data.tgl_akhir_acara)) {
            if (!Validator.isISO8601(data.tgl_akhir_acara)) {
                errors.tgl_akhir_acara = 'tanggal akhir acara harus format tanggal YYYY-MM-DD.';
            }
        }

        // Validasi tgl_awal_acara tidak boleh lebih besar dari tgl_akhir_acara
        if (!Validator.isEmpty(data.tgl_awal_acara) && !Validator.isEmpty(data.tgl_akhir_acara)) {
            if (new Date(data.tgl_awal_acara) > new Date(data.tgl_akhir_acara)) {
                errors.tgl_awal_acara = 'tanggal awal acara tidak boleh lebih besar dari tanggal akhir acara.';
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

        // Validasi poster jika diisi
        if (!Validator.isEmpty(data.poster)) {
            if (data.poster !== '#') {
                if (!Validator.isURL(data.poster, {
                        protocols: ['http', 'https'],
                        require_protocol: true
                    })) {
                    errors.poster = 'poster harus berupa URL (http/https) atau #.';
                }
            }
        }

        // Validasi bukti_bayar jika diisi
        if (!Validator.isEmpty(data.bukti_bayar)) {
            if (data.bukti_bayar !== '#') {
                if (!Validator.isURL(data.bukti_bayar, {
                        protocols: ['http', 'https'],
                        require_protocol: true
                    })) {
                    errors.bukti_bayar = 'bukti bayar harus berupa URL (http/https) atau #.';
                }
            }
        }

        // Validasi jenis jika diisi
        if (!Validator.isEmpty(data.jenis)) {
            if (!Validator.isIn(data.jenis, ['Suiseki', 'Bonsai'])) {
                errors.jenis = 'jenis tidak valid. harus Suiseki atau Bonsai.';
            }
        }

        // Validasi status jika diisi
        if (!Validator.isEmpty(data.status)) {
            const validStatus = ['BELUM BAYAR', 'MENUNGGU', 'DITERIMA', 'DIPENDING', 'DISESUAIKAN', 'SELESAI'];
            if (!Validator.isIn(data.status, validStatus)) {
                errors.status = `status tidak valid. harus salah satu dari: ${validStatus.join(', ')}.`;
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};