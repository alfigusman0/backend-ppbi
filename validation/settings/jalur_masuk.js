/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.ids_jalur_masuk = !isEmpty(data.ids_jalur_masuk) ? data.ids_jalur_masuk : '';
    data.pendaftaran_awal = !isEmpty(data.pendaftaran_awal) ? data.pendaftaran_awal : '';
    data.pendaftaran_akhir = !isEmpty(data.pendaftaran_akhir) ? data.pendaftaran_akhir : '';
    data.ukt_awal = !isEmpty(data.ukt_awal) ? data.ukt_awal : '';
    data.ukt_akhir = !isEmpty(data.ukt_akhir) ? data.ukt_akhir : '';
    data.pembayaran_awal = !isEmpty(data.pembayaran_awal) ? data.pembayaran_awal : '';
    data.pembayaran_akhir = !isEmpty(data.pembayaran_akhir) ? data.pembayaran_akhir : '';
    data.pemberkasan_awal = !isEmpty(data.pemberkasan_awal) ? data.pemberkasan_awal : '';
    data.pemberkasan_akhir = !isEmpty(data.pemberkasan_akhir) ? data.pemberkasan_akhir : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.ids_jalur_masuk)) {
            errors.ids_jalur_masuk = 'ids_jalur_masuk cannot be empty.';
        } else {
            if (!Validator.isInt(data.ids_jalur_masuk)) {
                errors.ids_jalur_masuk = 'invalid ids_jalur_masuk.';
            }
        }

        if (Validator.isEmpty(data.pendaftaran_awal)) {
            errors.pendaftaran_awal = 'pendaftaran_awal cannot be empty.';
        } else {
            // Additional regex for format YYYY-MM-DD HH:mm:ss
            /* const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
            if (!regex.test(data.pendaftaran_awal)) {
                errors.pendaftaran_awal = 'invalid pendaftaran_awal.';
            } */
            if (!Validator.isISO8601(data.pendaftaran_awal, {
                    strict: true
                })) {
                errors.pendaftaran_awal = 'invalid pendaftaran_awal.';
            }
        }

        if (Validator.isEmpty(data.pendaftaran_akhir)) {
            errors.pendaftaran_akhir = 'pendaftaran_akhir cannot be empty.';
        } else {
            // Additional regex for format YYYY-MM-DD HH:mm:ss
            /* const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
            if (!regex.test(data.pendaftaran_akhir)) {
                errors.pendaftaran_akhir = 'invalid pendaftaran_akhir.';
            } */
            if (!Validator.isISO8601(data.pendaftaran_akhir, {
                    strict: true
                })) {
                errors.pendaftaran_akhir = 'invalid pendaftaran_akhir.';
            }
        }

        if (Validator.isEmpty(data.ukt_awal)) {
            errors.ukt_awal = 'ukt_awal cannot be empty.';
        } else {
            // Additional regex for format YYYY-MM-DD HH:mm:ss
            /* const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
            if (!regex.test(data.ukt_awal)) {
                errors.ukt_awal = 'invalid ukt_awal.';
            } */
            if (!Validator.isISO8601(data.ukt_awal, {
                    strict: true
                })) {
                errors.ukt_awal = 'invalid ukt_awal.';
            }
        }

        if (Validator.isEmpty(data.ukt_akhir)) {
            errors.ukt_akhir = 'ukt_akhir cannot be empty.';
        } else {
            // Additional regex for format YYYY-MM-DD HH:mm:ss
            /* const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
            if (!regex.test(data.ukt_akhir)) {
                errors.ukt_akhir = 'invalid ukt_akhir.';
            } */
            if (!Validator.isISO8601(data.ukt_akhir, {
                    strict: true
                })) {
                errors.ukt_akhir = 'invalid ukt_akhir.';
            }
        }

        if (Validator.isEmpty(data.pembayaran_awal)) {
            errors.pembayaran_awal = 'pembayaran_awal cannot be empty.';
        } else {
            // Additional regex for format YYYY-MM-DD HH:mm:ss
            /* const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
            if (!regex.test(data.pembayaran_awal)) {
                errors.pembayaran_awal = 'invalid pembayaran_awal.';
            } */
            if (!Validator.isISO8601(data.pembayaran_awal, {
                    strict: true
                })) {
                errors.pembayaran_awal = 'invalid pembayaran_awal.';
            }
        }

        if (Validator.isEmpty(data.pembayaran_akhir)) {
            errors.pembayaran_akhir = 'pembayaran_akhir cannot be empty.';
        } else {
            // Additional regex for format YYYY-MM-DD HH:mm:ss
            /* const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
            if (!regex.test(data.pembayaran_akhir)) {
                errors.pembayaran_akhir = 'invalid pembayaran_akhir.';
            } */
            if (!Validator.isISO8601(data.pembayaran_akhir, {
                    strict: true
                })) {
                errors.pembayaran_akhir = 'invalid pembayaran_akhir.';
            }
        }

        if (Validator.isEmpty(data.pemberkasan_awal)) {
            errors.pemberkasan_awal = 'pemberkasan_awal cannot be empty.';
        } else {
            // Additional regex for format YYYY-MM-DD HH:mm:ss
            /* const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
            if (!regex.test(data.pemberkasan_awal)) {
                errors.pemberkasan_awal = 'invalid pemberkasan_awal.';
            } */
            if (!Validator.isISO8601(data.pemberkasan_awal, {
                    strict: true
                })) {
                errors.pemberkasan_awal = 'invalid pemberkasan_awal.';
            }
        }

        if (Validator.isEmpty(data.pemberkasan_akhir)) {
            errors.pemberkasan_akhir = 'pemberkasan_akhir cannot be empty.';
        } else {
            // Additional regex for format YYYY-MM-DD HH:mm:ss
            /* const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
            if (!regex.test(data.pemberkasan_akhir)) {
                errors.pemberkasan_akhir = 'invalid pemberkasan_akhir.';
            } */
            if (!Validator.isISO8601(data.pemberkasan_akhir, {
                    strict: true
                })) {
                errors.pemberkasan_akhir = 'invalid pemberkasan_akhir.';
            }
        }
    } else {
        if (!Validator.isEmpty(data.ids_jalur_masuk)) {
            if (!Validator.isInt(data.ids_jalur_masuk)) {
                errors.ids_jalur_masuk = 'invalid ids_jalur_masuk.';
            }
        }

        if (!Validator.isEmpty(data.pendaftaran_awal)) {
            if (!Validator.isISO8601(data.pendaftaran_awal, {
                    strict: true
                })) {
                errors.pendaftaran_awal = 'invalid pendaftaran_awal.';
            }
        }

        if (!Validator.isEmpty(data.pendaftaran_akhir)) {
            if (!Validator.isISO8601(data.pendaftaran_akhir, {
                    strict: true
                })) {
                errors.pendaftaran_akhir = 'invalid pendaftaran_akhir.';
            }
        }

        if (!Validator.isEmpty(data.ukt_awal)) {
            if (!Validator.isISO8601(data.ukt_awal, {
                    strict: true
                })) {
                errors.ukt_awal = 'invalid ukt_awal.';
            }
        }

        if (!Validator.isEmpty(data.ukt_akhir)) {
            if (!Validator.isISO8601(data.ukt_akhir, {
                    strict: true
                })) {
                errors.ukt_akhir = 'invalid ukt_akhir.';
            }
        }

        if (!Validator.isEmpty(data.pembayaran_awal)) {
            if (!Validator.isISO8601(data.pembayaran_awal, {
                    strict: true
                })) {
                errors.pembayaran_awal = 'invalid pembayaran_awal.';
            }
        }

        if (!Validator.isEmpty(data.pembayaran_akhir)) {
            if (!Validator.isISO8601(data.pembayaran_akhir, {
                    strict: true
                })) {
                errors.pembayaran_akhir = 'invalid pembayaran_akhir.';
            }
        }

        if (!Validator.isEmpty(data.pemberkasan_awal)) {
            if (!Validator.isISO8601(data.pemberkasan_awal, {
                    strict: true
                })) {
                errors.pemberkasan_awal = 'invalid pemberkasan_awal.';
            }
        }

        if (!Validator.isEmpty(data.pemberkasan_akhir)) {
            if (!Validator.isISO8601(data.pemberkasan_akhir, {
                    strict: true
                })) {
                errors.pemberkasan_akhir = 'invalid pemberkasan_akhir.';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};