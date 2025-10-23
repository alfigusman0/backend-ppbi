/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.ids_level = !isEmpty(data.ids_level) ? data.ids_level : '';
    data.grup = !isEmpty(data.grup) ? data.grup : '';
    data.deskripsi = !isEmpty(data.deskripsi) ? data.deskripsi : '';
    data.keterangan = !isEmpty(data.keterangan) ? data.keterangan : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    // Helper function untuk validasi JSON format keterangan
    const validateKeterangan = (keteranganString) => {
        if (Validator.isEmpty(keteranganString)) {
            return null; // Opsional, bisa kosong
        }

        try {
            // Coba parse JSON
            const parsed = JSON.parse(keteranganString);

            // Validasi struktur: harus memiliki ids_cabang
            if (!parsed.ids_cabang) {
                return 'keterangan harus mengandung field ids_cabang.';
            }

            // ids_cabang harus array atau comma-separated string
            if (Array.isArray(parsed.ids_cabang)) {
                // Validasi setiap element adalah number
                if (!parsed.ids_cabang.every(id => Number.isInteger(id))) {
                    return 'ids_cabang dalam keterangan harus berisi angka (integer).';
                }
            } else if (typeof parsed.ids_cabang === 'string') {
                // Convert comma-separated string ke array dan validasi
                const ids = parsed.ids_cabang.split(',').map(id => id.trim());
                if (!ids.every(id => !isNaN(parseInt(id)))) {
                    return 'ids_cabang dalam keterangan harus berisi angka (integer).';
                }
            } else {
                return 'ids_cabang dalam keterangan harus array atau string comma-separated.';
            }

            return null; // Valid
        } catch (e) {
            return 'keterangan harus format JSON yang valid.';
        }
    };

    // Validasi untuk method POST (Create)
    if (method === 'POST') {
        // Validasi field ids_level (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.ids_level)) {
            errors.ids_level = 'ids level tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.ids_level)) {
                errors.ids_level = 'ids level tidak valid.';
            }
        }

        // Validasi field grup (wajib diisi dan max 255 karakter)
        if (Validator.isEmpty(data.grup)) {
            errors.grup = 'grup tidak boleh kosong.';
        } else {
            if (!Validator.isLength(data.grup, {
                    min: 1,
                    max: 255
                })) {
                errors.grup = 'grup maksimal 255 karakter.';
            }
        }

        // Validasi field deskripsi (wajib diisi dan max 255 karakter)
        if (Validator.isEmpty(data.deskripsi)) {
            errors.deskripsi = 'deskripsi tidak boleh kosong.';
        } else {
            if (!Validator.isLength(data.deskripsi, {
                    min: 1,
                    max: 255
                })) {
                errors.deskripsi = 'deskripsi maksimal 255 karakter.';
            }
        }

        // Validasi field keterangan (opsional, tapi jika diisi harus JSON valid)
        if (!Validator.isEmpty(data.keterangan)) {
            const keteranganError = validateKeterangan(data.keterangan);
            if (keteranganError) {
                errors.keterangan = keteranganError;
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

        // Validasi ids_level jika diisi
        if (!Validator.isEmpty(data.ids_level)) {
            if (!Validator.isInt(data.ids_level)) {
                errors.ids_level = 'ids level tidak valid.';
            }
        }

        // Validasi grup jika diisi
        if (!Validator.isEmpty(data.grup)) {
            if (!Validator.isLength(data.grup, {
                    min: 1,
                    max: 255
                })) {
                errors.grup = 'grup maksimal 255 karakter.';
            }
        }

        // Validasi deskripsi jika diisi
        if (!Validator.isEmpty(data.deskripsi)) {
            if (!Validator.isLength(data.deskripsi, {
                    min: 1,
                    max: 255
                })) {
                errors.deskripsi = 'deskripsi maksimal 255 karakter.';
            }
        }

        // Validasi keterangan jika diisi
        if (!Validator.isEmpty(data.keterangan)) {
            const keteranganError = validateKeterangan(data.keterangan);
            if (keteranganError) {
                errors.keterangan = keteranganError;
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