/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.id_event = !isEmpty(data.id_event) ? data.id_event : '';
    data.nama_setting = !isEmpty(data.nama_setting) ? data.nama_setting : '';
    data.setting = !isEmpty(data.setting) ? data.setting : '';

    // Daftar nama_setting yang valid
    const validSettingNames = [
        'Whatsapp',
        'Metode Pembayaran',
        'Tanggal Awal Akses',
        'Tanggal Akhir Akses',
        'Tanggal Awal Pendaftaran',
        'Tanggal Akhir Pendaftaran',
        'Tanggal Awal Penilaian',
        'Tanggal Akhir Penilaian'
    ];

    // Helper function untuk validasi setting berdasarkan nama_setting
    const validateSettingValue = (nama_setting, setting_value) => {
        if (nama_setting === 'Whatsapp') {
            // Validasi token WhatsApp (simple check: min 10 karakter)
            if (!Validator.isLength(setting_value, {
                    min: 5,
                    max: 255
                })) {
                return 'token whatsapp harus 5-255 karakter.';
            }
            return null;
        } else if ([
                'Tanggal Awal Akses',
                'Tanggal Akhir Akses',
                'Tanggal Awal Pendaftaran',
                'Tanggal Akhir Pendaftaran',
                'Tanggal Awal Penilaian',
                'Tanggal Akhir Penilaian'
            ].includes(nama_setting)) {
            // Validasi format tanggal YYYY-MM-DD
            if (!Validator.isISO8601(setting_value)) {
                return `${nama_setting.toLowerCase()} harus format tanggal YYYY-MM-DD.`;
            }
            return null;
        } else if (nama_setting === 'Metode Pembayaran') {
            // Validasi metode pembayaran (text bebas, min 5 karakter)
            if (!Validator.isLength(setting_value, {
                    min: 5,
                    max: 255
                })) {
                return 'metode pembayaran harus 5-255 karakter.';
            }
            return null;
        }
        return null;
    };

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

        // Validasi field nama_setting (wajib diisi dan harus dari daftar yang valid)
        if (Validator.isEmpty(data.nama_setting)) {
            errors.nama_setting = 'nama setting tidak boleh kosong.';
        } else {
            if (!Validator.isIn(data.nama_setting, validSettingNames)) {
                errors.nama_setting = `nama setting tidak valid. harus salah satu dari: ${validSettingNames.join(', ')}.`;
            }
        }

        // Validasi field setting (wajib diisi dan max 255 karakter)
        if (Validator.isEmpty(data.setting)) {
            errors.setting = 'setting tidak boleh kosong.';
        } else {
            if (!Validator.isLength(data.setting, {
                    min: 1,
                    max: 255
                })) {
                errors.setting = 'setting maksimal 255 karakter.';
            }

            // Validasi nilai setting berdasarkan nama_setting
            if (!isEmpty(data.nama_setting) && Validator.isIn(data.nama_setting, validSettingNames)) {
                const settingError = validateSettingValue(data.nama_setting, data.setting);
                if (settingError) {
                    errors.setting = settingError;
                }
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

        // Validasi nama_setting jika diisi
        if (!Validator.isEmpty(data.nama_setting)) {
            if (!Validator.isIn(data.nama_setting, validSettingNames)) {
                errors.nama_setting = `nama setting tidak valid. harus salah satu dari: ${validSettingNames.join(', ')}.`;
            }
        }

        // Validasi setting jika diisi
        if (!Validator.isEmpty(data.setting)) {
            if (!Validator.isLength(data.setting, {
                    min: 1,
                    max: 255
                })) {
                errors.setting = 'setting maksimal 255 karakter.';
            }

            // Validasi nilai setting berdasarkan nama_setting
            if (!isEmpty(data.nama_setting) && Validator.isIn(data.nama_setting, validSettingNames)) {
                const settingError = validateSettingValue(data.nama_setting, data.setting);
                if (settingError) {
                    errors.setting = settingError;
                }
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};