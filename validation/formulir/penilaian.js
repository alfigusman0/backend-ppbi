/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    // Normalisasi data - konversi ke string kosong jika undefined/null
    data.id_formulir = !isEmpty(data.id_formulir) ? data.id_formulir : '';
    data.id_profile = !isEmpty(data.id_profile) ? data.id_profile : '';
    data.penampilan = !isEmpty(data.penampilan) ? data.penampilan : '';
    data.gerak_dasar = !isEmpty(data.gerak_dasar) ? data.gerak_dasar : '';
    data.keserasian = !isEmpty(data.keserasian) ? data.keserasian : '';
    data.kematangan = !isEmpty(data.kematangan) ? data.kematangan : '';
    data.total = !isEmpty(data.total) ? data.total : '';
    data.kriteria = !isEmpty(data.kriteria) ? data.kriteria : '';
    data.keterangan = !isEmpty(data.keterangan) ? data.keterangan : '';

    // Helper function untuk validasi nilai penilaian (0-100)
    const validateScore = (value, fieldName) => {
        if (Validator.isEmpty(value)) {
            return `${fieldName} tidak boleh kosong.`;
        }

        if (!Validator.isFloat(value)) {
            return `${fieldName} harus berupa angka desimal.`;
        }

        const floatValue = parseFloat(value);
        if (floatValue < 0 || floatValue > 100) {
            return `${fieldName} harus antara 0 hingga 100.`;
        }

        return null; // Valid
    };

    // Validasi untuk method POST (Create)
    if (method === 'POST') {
        // Validasi field id_formulir (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.id_formulir)) {
            errors.id_formulir = 'id formulir tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.id_formulir)) {
                errors.id_formulir = 'id formulir tidak valid.';
            }
        }

        // Validasi field id_profile (wajib diisi dan harus integer)
        if (Validator.isEmpty(data.id_profile)) {
            errors.id_profile = 'id profile tidak boleh kosong.';
        } else {
            if (!Validator.isInt(data.id_profile)) {
                errors.id_profile = 'id profile tidak valid.';
            }
        }

        // Validasi field penampilan (wajib diisi, 0-100)
        const penampilan = validateScore(data.penampilan, 'penampilan');
        if (penampilan) {
            errors.penampilan = penampilan;
        }

        // Validasi field gerak_dasar (wajib diisi, 0-100)
        const gerakDasar = validateScore(data.gerak_dasar, 'gerak dasar');
        if (gerakDasar) {
            errors.gerak_dasar = gerakDasar;
        }

        // Validasi field keserasian (wajib diisi, 0-100)
        const keserasian = validateScore(data.keserasian, 'keserasian');
        if (keserasian) {
            errors.keserasian = keserasian;
        }

        // Validasi field kematangan (wajib diisi, 0-100)
        const kematangan = validateScore(data.kematangan, 'kematangan');
        if (kematangan) {
            errors.kematangan = kematangan;
        }

        // Validasi field total (wajib diisi, harus = rata-rata dari 4 kriteria)
        const totalError = validateScore(data.total, 'total');
        if (totalError) {
            errors.total = totalError;
        } else {
            // Validasi total = rata-rata (penampilan + gerak_dasar + keserasian + kematangan) / 4
            if (!isEmpty(data.penampilan) && !isEmpty(data.gerak_dasar) &&
                !isEmpty(data.keserasian) && !isEmpty(data.kematangan)) {

                const pen = parseFloat(data.penampilan);
                const gd = parseFloat(data.gerak_dasar);
                const kes = parseFloat(data.keserasian);
                const kem = parseFloat(data.kematangan);
                const expectedTotal = (pen + gd + kes + kem) / 4;
                const actualTotal = parseFloat(data.total);

                // Toleransi 0.01 untuk pembulatan
                if (Math.abs(actualTotal - expectedTotal) > 0.01) {
                    errors.total = `total harus sama dengan rata-rata dari 4 kriteria (${expectedTotal.toFixed(2)}).`;
                }
            }
        }

        if (Validator.isEmpty(data.kriteria)) {
            errors.kriteria = 'kriteria tidak boleh kosong.';
        } else {
            if (!Validator.isIn(data.kriteria, ['A', 'B', 'C', 'D'])) {
                errors.kriteria = 'kriteria tidak valid. harus A, B, C, atau D.';
            }
        }
    } else {
        // Validasi untuk method lain (PUT/PATCH untuk Update)
        // Field bersifat opsional, tapi jika diisi harus valid

        // Validasi id_formulir jika diisi
        if (!Validator.isEmpty(data.id_formulir)) {
            if (!Validator.isInt(data.id_formulir)) {
                errors.id_formulir = 'id formulir tidak valid.';
            }
        }

        // Validasi id_profile jika diisi
        if (!Validator.isEmpty(data.id_profile)) {
            if (!Validator.isInt(data.id_profile)) {
                errors.id_profile = 'id profile tidak valid.';
            }
        }

        // Validasi penampilan jika diisi
        if (!Validator.isEmpty(data.penampilan)) {
            const penampilan = validateScore(data.penampilan, 'penampilan');
            if (penampilan) {
                errors.penampilan = penampilan;
            }
        }

        // Validasi gerak_dasar jika diisi
        if (!Validator.isEmpty(data.gerak_dasar)) {
            const gerakDasar = validateScore(data.gerak_dasar, 'gerak dasar');
            if (gerakDasar) {
                errors.gerak_dasar = gerakDasar;
            }
        }

        // Validasi keserasian jika diisi
        if (!Validator.isEmpty(data.keserasian)) {
            const keserasian = validateScore(data.keserasian, 'keserasian');
            if (keserasian) {
                errors.keserasian = keserasian;
            }
        }

        // Validasi kematangan jika diisi
        if (!Validator.isEmpty(data.kematangan)) {
            const kematangan = validateScore(data.kematangan, 'kematangan');
            if (kematangan) {
                errors.kematangan = kematangan;
            }
        }

        // Validasi total jika diisi
        if (!Validator.isEmpty(data.total)) {
            const totalError = validateScore(data.total, 'total');
            if (totalError) {
                errors.total = totalError;
            }
        }

        if (!Validator.isEmpty(data.kriteria)) {
            if (!Validator.isIn(data.kriteria, ['A', 'B', 'C', 'D'])) {
                errors.kriteria = 'kriteria tidak valid. harus A, B, C, atau D.';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};