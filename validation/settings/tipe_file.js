/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
    let errors = {};

    data.setting = !isEmpty(data.setting) ? data.setting : '';
    data.nama_file = !isEmpty(data.nama_file) ? data.nama_file : '';
    data.extensi = !isEmpty(data.extensi) ? data.extensi : '';
    data.max_size = !isEmpty(data.max_size) ? data.max_size : '';
    data.upload = !isEmpty(data.upload) ? data.upload : '';
    data.template = !isEmpty(data.template) ? data.template : '';
    data.jalur_masuk = !isEmpty(data.jalur_masuk) ? data.jalur_masuk : '';
    data.tipe_ujian = !isEmpty(data.tipe_ujian) ? data.tipe_ujian : '';
    data.status = !isEmpty(data.status) ? data.status : '';

    if (method === 'POST') {
        if (Validator.isEmpty(data.setting)) {
            errors.setting = 'setting cannot be empty.';
        }

        if (Validator.isEmpty(data.nama_file)) {
            errors.nama_file = 'nama_file cannot be empty.';
        }

        if (Validator.isEmpty(data.extensi)) {
            errors.extensi = 'extensi cannot be empty.';
        } else {
            // validation for extensi ex: 'JPG', 'JPG|PNG', 'JPEG|JPG|PNG|PDF'
            const extPattern = /^([a-zA-Z0-9]+)(\|[a-zA-Z0-9]+)*$/;
            if (!extPattern.test(data.extensi)) {
                errors.extensi = 'invalid extensi value.';
            }
        }

        if (Validator.isEmpty(data.max_size)) {
            errors.max_size = 'max_size cannot be empty.';
        } else {
            // validation for max_size ex: '2MB', '500KB', '1GB'
            const sizePattern = /^(0|[1-9]\d*)(KB|MB|GB)$/i;
            if (!sizePattern.test(data.max_size)) {
                errors.max_size = 'invalid max_size value.';
            }
        }

        if (Validator.isEmpty(data.upload)) {
            errors.template = 'upload cannot be empty.';
        } else {
            if (!Validator.isIn(data.upload, ['Wajib', 'Opsional'])) {
                errors.upload = 'invalid upload value.';
            }
        }

        if (!Validator.isEmpty(data.template)) {
            if (data.template !== '#') {
                if (!Validator.isURL(data.template)) {
                    errors.template = 'invalid template URL.';
                }
            }
        }

        if (Validator.isEmpty(data.status)) {
            errors.status = 'status cannot be empty.';
        } else {
            if (!Validator.isIn(data.status, ['YA', 'TIDAK'])) {
                errors.status = 'invalid status.';
            }
        }
    } else {
        if (!Validator.isEmpty(data.extensi)) {
            // validation for extensi ex: 'JPG', 'JPG|PNG', 'JPEG|JPG|PNG|PDF'
            const extPattern = /^([a-zA-Z0-9]+)(\|[a-zA-Z0-9]+)*$/;
            if (!extPattern.test(data.extensi)) {
                errors.extensi = 'invalid extensi value.';
            }
        }

        if (!Validator.isEmpty(data.max_size)) {
            // validation for max_size ex: '2MB', '500KB', '1GB'
            const sizePattern = /^(0|[1-9]\d*)(KB|MB|GB)$/i;
            if (!sizePattern.test(data.max_size)) {
                errors.max_size = 'invalid max_size value.';
            }
        }

        if (!Validator.isEmpty(data.upload)) {
            if (!Validator.isIn(data.upload, ['Wajib', 'Opsional'])) {
                errors.upload = 'invalid upload value.';
            }
        }

        if (!Validator.isEmpty(data.template)) {
            if (data.template !== '#') {
                if (!Validator.isURL(data.template)) {
                    errors.template = 'invalid template URL.';
                }
            }
        }

        if (!Validator.isEmpty(data.status)) {
            if (!Validator.isIn(data.status, ['YA', 'TIDAK'])) {
                errors.status = 'invalid status.';
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};