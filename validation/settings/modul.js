/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.modul = !isEmpty(data.modul) ? data.modul : '';
    data.aksi = !isEmpty(data.aksi) ? data.aksi : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    // Daftar aksi yang valid
    const validAksi = ['create', 'read', 'update', 'delete', 'single', 'import', 'export', 'generate', 'statistik'];

    // Helper function untuk validasi aksi (comma-separated)
    const validateAksiList = (aksiString) => {
        if (Validator.isEmpty(aksiString)) {
            return 'aksi tidak boleh kosong.';
        }

        // Split by comma dan trim whitespace
        const aksiList = aksiString.split(',').map(a => a.trim());
        // ✅ Untuk "read" → split(",") = ["read"]
        // ✅ Untuk "read,update" → split(",") = ["read", "update"]

        // Cek untuk aksi kosong setelah trim
        if (aksiList.some(a => a === '')) {
            return 'aksi tidak boleh mengandung nilai kosong.';
        }

        // Cek setiap aksi apakah valid
        for (const aksi of aksiList) {
            if (!Validator.isIn(aksi, validAksi)) {
                return `aksi "${aksi}" tidak valid. hanya boleh: ${validAksi.join(', ')}.`;
            }
        }

        return null; // Valid
    };

    // Validasi untuk method POST (Create)
    if (method === 'POST') {
        // Validasi field modul (wajib diisi dan max 100 karakter)
        if (Validator.isEmpty(data.modul)) {
            errors.modul = 'modul tidak boleh kosong.';
        } else {
            if (!Validator.isLength(data.modul, {
                    min: 1,
                    max: 100
                })) {
                errors.modul = 'modul maksimal 100 karakter.';
            }
        }

        // Validasi field aksi (wajib diisi, comma-separated, hanya aksi valid)
        const aksiError = validateAksiList(data.aksi);
        if (aksiError) {
            errors.aksi = aksiError;
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

        // Validasi modul jika diisi
        if (!Validator.isEmpty(data.modul)) {
            if (!Validator.isLength(data.modul, {
                    min: 1,
                    max: 100
                })) {
                errors.modul = 'modul maksimal 100 karakter.';
            }
        }

        // Validasi aksi jika diisi
        if (!Validator.isEmpty(data.aksi)) {
            const aksiError = validateAksiList(data.aksi);
            if (aksiError) {
                errors.aksi = aksiError;
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