/* Libraries */
const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateInput(method, path, data) {
  let errors = {};

  data.ids_grup = !isEmpty(data.ids_grup) ? data.ids_grup : '';
  data.nama = !isEmpty(data.nama) ? data.nama : '';
  data.email = !isEmpty(data.email) ? data.email : '';
  data.username = !isEmpty(data.username) ? data.username : '';
  data.password = !isEmpty(data.password) ? data.password : '';
  data.confirm_password = !isEmpty(data.confirm_password) ? data.confirm_password : '';
  data.nmr_tlpn = !isEmpty(data.nmr_tlpn) ? data.nmr_tlpn : '';
  data.mandiri = !isEmpty(data.mandiri) ? data.mandiri : '';

  if (method === 'POST') {
    if (Validator.isEmpty(data.ids_grup)) {
      errors.ids_grup = 'ids_grup cannot be empty.';
    } else {
      if (!Validator.isInt(data.ids_grup)) {
        errors.ids_grup = 'invalid ids_grup.';
      }
    }

    if (Validator.isEmpty(data.nama)) {
      errors.nama = 'nama cannot be empty.';
    } else {
      if (!Validator.isLength(data.nama, {
          min: 2,
          max: 100
        })) {
        errors.nama = 'nama must be at least 2 characters but not more than 100 characters .';
      }
    }

    if (Validator.isEmpty(data.email)) {
      errors.email = 'email cannot be empty.';
    } else {
      if (!Validator.isEmail(data.email)) {
        errors.email = 'email is invalid.';
      }
    }

    if (Validator.isEmpty(data.username)) {
      errors.username = 'username cannot be empty.';
    } else {
      if (!Validator.isLength(data.username, {
          min: 3,
          max: 100
        })) {
        errors.username = 'username must be at least 2 characters but not more than 100 characters .';
      }
    }

    if (Validator.isEmpty(data.password)) {
      errors.password = 'password cannot be empty.';
    } else {
      if (!Validator.isStrongPassword(data.password, {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        })) {
        errors.password = 'password must be at least 6 characters but not more than 100 characters .';
      }
    }

    if (Validator.isEmpty(data.confirm_password)) {
      errors.confirm_password = 'confirm password cannot be empty.';
    } else {
      if (!Validator.equals(data.password, data.confirm_password)) {
        errors.confirm_password = 'password and confirm password do not match.';
      }
    }

    if (Validator.isEmpty(data.nmr_tlpn)) {
      errors.nmr_tlpn = 'nomor telepon cannot be empty.';
    }

    if (Validator.isEmpty(data.nmr_tlpn)) {
      errors.nmr_tlpn = 'nomor telepon cannot be empty.';
    } else {
      if (!Validator.isLength(data.nmr_tlpn, {
          min: 9,
          max: 20
        })) {
        errors.nmr_tlpn = 'nomor telepon must be at least 9 characters but not more than 20 characters .';
      }
    }

    if (Validator.isEmpty(data.mandiri)) {
      errors.mandiri = 'mandiri cannot be empty.';
    } else {
      if (!Validator.isIn(data.mandiri, ['BELUM MEMILIH', 'INDIVIDU', 'KOLEKTIF'])) {
        errors.mandiri = 'invalid mandiri.';
      }
    }
  } else {
    if (!Validator.isEmpty(data.ids_grup)) {
      if (!Validator.isInt(data.ids_grup)) {
        errors.ids_grup = 'invalid ids_grup.';
      }
    }

    if (!Validator.isEmpty(data.nama)) {
      if (!Validator.isLength(data.nama, {
          min: 2,
          max: 100
        })) {
        errors.nama = 'nama must be at least 2 characters but not more than 100 characters .';
      }
    }

    if (!Validator.isEmpty(data.email)) {
      if (!Validator.isEmail(data.email)) {
        errors.email = 'email is invalid.';
      }
    }

    if (!Validator.isEmpty(data.username)) {
      if (!Validator.isLength(data.username, {
          min: 3,
          max: 100
        })) {
        errors.username = 'username must be at least 2 characters but not more than 100 characters .';
      }
    }

    if (!Validator.isEmpty(data.password)) {
      if (!Validator.isStrongPassword(data.password, {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        })) {
        errors.password = 'password must be at least 6 characters but not more than 100 characters .';
      }
    }

    if (!Validator.isEmpty(data.confirm_password) || !Validator.isEmpty(data.password)) {
      if (!Validator.equals(data.password, data.confirm_password)) {
        errors.confirm_password = 'password and confirm password do not match.';
      }
    }

    if (!Validator.isEmpty(data.nmr_tlpn)) {
      if (!Validator.isLength(data.nmr_tlpn, {
          min: 9,
          max: 20
        })) {
        errors.nmr_tlpn = 'nomor telepon must be at least 9 characters but not more than 20 characters .';
      }
    }

    if (!Validator.isEmpty(data.mandiri)) {
      if (!Validator.isIn(data.mandiri, ['BELUM MEMILIH', 'INDIVIDU', 'KOLEKTIF'])) {
        errors.mandiri = 'invalid mandiri.';
      }
    }
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};