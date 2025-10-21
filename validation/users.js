/* Libraries */
const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateInput(method, path, data) {
  let errors = {};

  data.ids_grup = !isEmpty(data.ids_grup) ? data.ids_grup : '';
  data.username = !isEmpty(data.username) ? data.username : '';
  data.password = !isEmpty(data.password) ? data.password : '';
  data.confirm_password = !isEmpty(data.confirm_password) ? data.confirm_password : '';
  data.reset = !isEmpty(data.reset) ? data.reset : '';

  if (method === 'POST') {
    if (Validator.isEmpty(data.ids_grup)) {
      errors.ids_grup = 'ids_grup cannot be empty.';
    } else {
      if (!Validator.isInt(data.ids_grup)) {
        errors.ids_grup = 'invalid ids_grup.';
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
  } else {
    if (!Validator.isEmpty(data.ids_grup)) {
      if (!Validator.isInt(data.ids_grup)) {
        errors.ids_grup = 'invalid ids_grup.';
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
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};