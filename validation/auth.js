/* Libraries */
const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateInput(method, path, data) {
  let errors = {};

  data.nama = !isEmpty(data.nama) ? data.nama : '';
  data.email = !isEmpty(data.email) ? data.email : '';
  data.nmr_tlpn = !isEmpty(data.nmr_tlpn) ? data.nmr_tlpn : '';
  data.username = !isEmpty(data.username) ? data.username : '';
  data.password = !isEmpty(data.password) ? data.password : '';
  data.confirm_password = !isEmpty(data.confirm_password) ? data.confirm_password : '';

  if (method === 'POST') {
    if (path === '/register') {
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

      if (Validator.isEmpty(data.nmr_tlpn)) {
        errors.nmr_tlpn = 'nomor telepon cannot be empty.';
      } else {
        if (!Validator.isMobilePhone(data.nmr_tlpn, 'id-ID')) {
          errors.nmr_tlpn = 'nomor telepon is invalid.';
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
    }

    if (path === '/login') {
      if (Validator.isEmpty(data.email)) {
        errors.email = 'email cannot be empty.';
      }

      if (Validator.isEmpty(data.password)) {
        errors.password = 'password cannot be empty.';
      }
    }
  } else {}

  return {
    errors,
    isValid: isEmpty(errors),
  };
};