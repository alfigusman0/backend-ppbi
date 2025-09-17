/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.idd_kelulusan = !isEmpty(data.idd_kelulusan) ? data.idd_kelulusan : '';
    data.jenjang = !isEmpty(data.jenjang) ? data.jenjang : '';
    data.nama_univ = !isEmpty(data.nama_univ) ? data.nama_univ : '';
    data.status_univ = !isEmpty(data.status_univ) ? data.status_univ : '';
    data.fakultas = !isEmpty(data.fakultas) ? data.fakultas : '';
    data.jurusan = !isEmpty(data.jurusan) ? data.jurusan : '';
    data.akreditasi = !isEmpty(data.akreditasi) ? data.akreditasi : '';
    data.jalur_penyesuaian_studi = !isEmpty(data.jalur_penyesuaian_studi) ? data.jalur_penyesuaian_studi : '';
    data.ipk = !isEmpty(data.ipk) ? data.ipk : '';
    data.tgl_lulus = !isEmpty(data.tgl_lulus) ? data.tgl_lulus : '';
    data.gelar = !isEmpty(data.gelar) ? data.gelar : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.idd_kelulusan)) {
            errors.idd_kelulusan = 'idd kelulusan wajib diisi';
        } else {
            if (!Validator.isInt(data.idd_kelulusan)) {
                errors.idd_kelulusan = 'idd kelulusan harus berupa angka';
            }
        }

        if (Validator.isEmpty(data.jenjang)) {
            errors.jenjang = 'jenjang wajib diisi';
        } else {
            if (!Validator.isIn(data.jenjang, ['S1', 'S2', 'S3'])) {
                errors.jenjang = 'jenjang harus diisi dengan S1, S2, atau S3';
            }
        }

        if (Validator.isEmpty(data.nama_univ)) {
            errors.nama_univ = 'nama univ wajib diisi';
        } else {
            if (!Validator.isLength(data.nama_univ, {
                    min: 1,
                    max: 255
                })) {
                errors.nama_univ = 'nama univ harus antara 1 sampai 255 karakter';
            }
        }

        if (Validator.isEmpty(data.status_univ)) {
            errors.status_univ = 'status univ wajib diisi';
        } else {
            if (!Validator.isIn(data.status_univ, ['Negeri', 'Swasta', 'Luar Negeri'])) {
                errors.status_univ = 'status univ harus diisi dengan Negeri, Swasta, atau Luar Negeri';
            }
        }

        if (Validator.isEmpty(data.fakultas)) {
            errors.fakultas = 'fakultas wajib diisi';
        } else {
            if (!Validator.isLength(data.fakultas, {
                    min: 1,
                    max: 255
                })) {
                errors.fakultas = 'fakultas harus antara 1 sampai 255 karakter';
            }
        }

        if (Validator.isEmpty(data.jurusan)) {
            errors.jurusan = 'jurusan wajib diisi';
        } else {
            if (!Validator.isLength(data.jurusan, {
                    min: 1,
                    max: 255
                })) {
                errors.jurusan = 'jurusan harus antara 1 sampai 255 karakter';
            }
        }

        if (Validator.isEmpty(data.akreditasi)) {
            errors.akreditasi = 'akreditasi wajib diisi';
        } else {
            if (!Validator.isIn(data.akreditasi, ['Terakreditasi', 'Belum Terakreditasi'])) {
                errors.akreditasi = 'akreditasi harus diisi dengan Terakreditasi atau Belum Terakreditasi';
            }
        }

        if (Validator.isEmpty(data.jalur_penyesuaian_studi)) {
            errors.jalur_penyesuaian_studi = 'jalur penyesuaian studi wajib diisi';
        } else {
            if (!Validator.isIn(data.jalur_penyesuaian_studi, ['Skripsi', 'Non-Skripsi'])) {
                errors.jalur_penyesuaian_studi = 'jalur penyesuaian studi harus diisi dengan Skripsi atau Non-Skripsi';
            }
        }

        if (Validator.isEmpty(data.ipk)) {
            errors.ipk = 'ipk wajib diisi';
        } else {
            if (!Validator.isLength(data.ipk, {
                    min: 1,
                    max: 4
                })) {
                errors.ipk = 'ipk harus antara 1 sampai 4 karakter';
            }
        }

        if (Validator.isEmpty(data.tgl_lulus)) {
            errors.tgl_lulus = 'tanggal lulus wajib diisi';
        } else {
            if (!Validator.isDate(data.tgl_lulus)) {
                errors.tgl_lulus = 'tanggal lulus harus berupa tanggal yang valid (yyyy-mm-dd)';
            }
        }

        if (Validator.isEmpty(data.gelar)) {
            errors.gelar = 'gelar wajib diisi';
        } else {
            if (!Validator.isLength(data.gelar, {
                    min: 1,
                    max: 15
                })) {
                errors.gelar = 'gelar harus antara 1 sampai 15 karakter';
            }
        }
    } else if (method === 'PUT') {
        if (!Validator.isEmpty(data.idd_kelulusan)) {
            if (!Validator.isInt(data.idd_kelulusan)) {
                errors.idd_kelulusan = 'idd kelulusan harus berupa angka';
            }
        }

        if (!Validator.isEmpty(data.jenjang)) {
            if (!Validator.isIn(data.jenjang, ['S1', 'S2', 'S3'])) {
                errors.jenjang = 'jenjang harus diisi dengan S1, S2, atau S3';
            }
        }

        if (!Validator.isEmpty(data.nama_univ)) {
            if (!Validator.isLength(data.nama_univ, {
                    min: 1,
                    max: 255
                })) {
                errors.nama_univ = 'nama univ harus antara 1 sampai 255 karakter';
            }
        }

        if (!Validator.isEmpty(data.status_univ)) {
            if (!Validator.isIn(data.status_univ, ['Negeri', 'Swasta', 'Luar Negeri'])) {
                errors.status_univ = 'status univ harus diisi dengan Negeri, Swasta, atau Luar Negeri';
            }
        }

        if (!Validator.isEmpty(data.fakultas)) {
            if (!Validator.isLength(data.fakultas, {
                    min: 1,
                    max: 255
                })) {
                errors.fakultas = 'fakultas harus antara 1 sampai 255 karakter';
            }
        }

        if (!Validator.isEmpty(data.jurusan)) {
            if (!Validator.isLength(data.jurusan, {
                    min: 1,
                    max: 255
                })) {
                errors.jurusan = 'jurusan harus antara 1 sampai 255 karakter';
            }
        }

        if (!Validator.isEmpty(data.akreditasi)) {
            if (!Validator.isIn(data.akreditasi, ['Terakreditasi', 'Belum Terakreditasi'])) {
                errors.akreditasi = 'invalid akreditasi';
            }
        }

        if (!Validator.isEmpty(data.jalur_penyesuaian_studi)) {
            if (!Validator.isIn(data.jalur_penyesuaian_studi, ['Skripsi', 'Non-Skripsi'])) {
                errors.jalur_penyesuaian_studi = 'jalur penyesuaian studi harus diisi dengan Skripsi atau Non-Skripsi';
            }
        }

        if (!Validator.isEmpty(data.ipk)) {
            if (!Validator.isLength(data.ipk, {
                    min: 1,
                    max: 4
                })) {
                errors.ipk = 'ipk harus antara 1 sampai 4 karakter';
            }
        }

        if (!Validator.isEmpty(data.tgl_lulus)) {
            if (!Validator.isDate(data.tgl_lulus)) {
                errors.tgl_lulus = 'tanggal lulus harus berupa tanggal yang valid (yyyy-mm-dd)';
            }
        }

        if (!Validator.isEmpty(data.gelar)) {
            if (!Validator.isLength(data.gelar, {
                    min: 1,
                    max: 15
                })) {
                errors.gelar = 'gelar harus antara 1 sampai 15 karakter';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};