/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.ids_level = !isEmpty(data.ids_level) ? data.ids_level : '';
    data.ids_modul = !isEmpty(data.ids_modul) ? data.ids_modul : '';
    data.permission = !isEmpty(data.permission) ? data.permission : '';

    // Daftar aksi yang valid (sama seperti modul)
    const validAksi = ['create', 'read', 'update', 'delete', 'single', 'import', 'export', 'generate', 'statistik'];

    // Helper function untuk validasi permission (comma-separated aksi)
    const validatePermission = (permissionString) => {
        if (Validator.isEmpty(permissionString)) {
            return 'permission tidak boleh kosong.';
        }

        // Split by comma dan trim whitespace
        const permissionList = permissionString.split(',').map(p => p.trim());

        // Cek untuk permission kosong setelah trim
        if (permissionList.some(p => p === '')) {
            return 'permission tidak boleh mengandung nilai kosong.';
        }

        // Cek setiap permission apakah valid
        for (const aksi of permissionList) {
            if (!Validator.isIn(aksi, validAksi)) {
                return `permission "${aksi}" tidak valid. hanya boleh: ${validAksi.join(', ')}.`;
            }
        }

        return null; // Valid
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

        // Validasi field ids_modul (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.ids_modul)) {
            errors.ids_modul = 'ids modul tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.ids_modul)) {
                errors.ids_modul = 'ids modul tidak valid.';
            }
        }

        // Validasi field permission (wajib diisi, comma-separated, hanya aksi valid)
        const permissionError = validatePermission(data.permission);
        if (permissionError) {
            errors.permission = permissionError;
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

        // Validasi ids_modul jika diisi
        if (!Validator.isEmpty(data.ids_modul)) {
            if (!Validator.isInt(data.ids_modul)) {
                errors.ids_modul = 'ids modul tidak valid.';
            }
        }

        // Validasi permission jika diisi
        if (!Validator.isEmpty(data.permission)) {
            const permissionError = validatePermission(data.permission);
            if (permissionError) {
                errors.permission = permissionError;
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};