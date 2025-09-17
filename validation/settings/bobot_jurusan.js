/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.kode_jurusan = !isEmpty(data.kode_jurusan) ? data.kode_jurusan : '';
    data.tpa = !isEmpty(data.tpa) ? data.tpa : '';
    data.ips = !isEmpty(data.ips) ? data.ips : '';
    data.ipa = !isEmpty(data.ipa) ? data.ipa : '';
    data.btq = !isEmpty(data.btq) ? data.btq : '';
    data.tkd = !isEmpty(data.tkd) ? data.tkd : '';
    data.keislaman = !isEmpty(data.keislaman) ? data.keislaman : '';
    data.bhs_arab = !isEmpty(data.bhs_arab) ? data.bhs_arab : '';
    data.bhs_inggris = !isEmpty(data.bhs_inggris) ? data.bhs_inggris : '';
    data.bhs_indonesia = !isEmpty(data.bhs_indonesia) ? data.bhs_indonesia : '';
    data.pembagi = !isEmpty(data.pembagi) ? data.pembagi : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.kode_jurusan)) {
            errors.kode_jurusan = 'kode jurusan cannot be empty.';
        }

        if (Validator.isEmpty(data.tpa)) {
            errors.tpa = 'tpa cannot be empty.';
        } else {
            if (!Validator.isInt(data.tpa)) {
                errors.tpa = 'invalid tpa.';
            }
        }

        if (Validator.isEmpty(data.ips)) {
            errors.ips = 'ips cannot be empty.';
        } else {
            if (!Validator.isInt(data.ips)) {
                errors.ips = 'invalid ips.';
            }
        }

        if (Validator.isEmpty(data.ipa)) {
            errors.ipa = 'ipa cannot be empty.';
        } else {
            if (!Validator.isInt(data.ipa)) {
                errors.ipa = 'invalid ipa.';
            }
        }

        if (Validator.isEmpty(data.btq)) {
            errors.btq = 'btq cannot be empty.';
        } else {
            if (!Validator.isInt(data.btq)) {
                errors.btq = 'invalid btq.';
            }
        }

        if (Validator.isEmpty(data.tkd)) {
            errors.tkd = 'tkd cannot be empty.';
        } else {
            if (!Validator.isInt(data.tkd)) {
                errors.tkd = 'invalid tkd.';
            }
        }

        if (Validator.isEmpty(data.keislaman)) {
            errors.keislaman = 'keislaman cannot be empty.';
        } else {
            if (!Validator.isInt(data.keislaman)) {
                errors.keislaman = 'invalid keislaman.';
            }
        }

        if (Validator.isEmpty(data.bhs_arab)) {
            errors.bhs_arab = 'bhs_arab cannot be empty.';
        } else {
            if (!Validator.isInt(data.bhs_arab)) {
                errors.bhs_arab = 'invalid bahasa arab.';
            }
        }

        if (Validator.isEmpty(data.bhs_inggris)) {
            errors.bhs_inggris = 'bhs_inggris cannot be empty.';
        } else {
            if (!Validator.isInt(data.bhs_inggris)) {
                errors.bhs_inggris = 'invalid bahasa inggris.';
            }
        }

        if (Validator.isEmpty(data.bhs_indonesia)) {
            errors.bhs_indonesia = 'bhs_indonesia cannot be empty.';
        } else {
            if (!Validator.isInt(data.bhs_indonesia)) {
                errors.bhs_indonesia = 'invalid bahasa indonesia.';
            }
        }

        if (Validator.isEmpty(data.pembagi)) {
            errors.pembagi = 'pembagi cannot be empty.';
        } else {
            if (!Validator.isInt(data.pembagi)) {
                errors.pembagi = 'invalid pembagi.';
            }
        }
    } else {
        if (!Validator.isEmpty(data.tpa)) {
            if (!Validator.isInt(data.tpa)) {
                errors.tpa = 'invalid tpa.';
            }
        }

        if (!Validator.isEmpty(data.ips)) {
            if (!Validator.isInt(data.ips)) {
                errors.ips = 'invalid ips.';
            }
        }

        if (!Validator.isEmpty(data.ipa)) {
            if (!Validator.isInt(data.ipa)) {
                errors.ipa = 'invalid ipa.';
            }
        }

        if (!Validator.isEmpty(data.btq)) {
            if (!Validator.isInt(data.btq)) {
                errors.btq = 'invalid btq.';
            }
        }

        if (!Validator.isEmpty(data.tkd)) {
            if (!Validator.isInt(data.tkd)) {
                errors.tkd = 'invalid tkd.';
            }
        }

        if (!Validator.isEmpty(data.keislaman)) {
            if (!Validator.isInt(data.keislaman)) {
                errors.keislaman = 'invalid keislaman.';
            }
        }

        if (!Validator.isEmpty(data.bhs_arab)) {
            if (!Validator.isInt(data.bhs_arab)) {
                errors.bhs_arab = 'invalid bahasa arab.';
            }
        }

        if (!Validator.isEmpty(data.bhs_inggris)) {
            if (!Validator.isInt(data.bhs_inggris)) {
                errors.bhs_inggris = 'invalid bahasa inggris.';
            }
        }

        if (!Validator.isEmpty(data.bhs_indonesia)) {
            if (!Validator.isInt(data.bhs_indonesia)) {
                errors.bhs_indonesia = 'invalid bahasa indonesia.';
            }
        }

        if (!Validator.isEmpty(data.pembagi)) {
            if (!Validator.isInt(data.pembagi)) {
                errors.pembagi = 'invalid pembagi.';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};