/* Libraries */
const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateInput(method, path, data) {
  let errors = {};

  data.username = !isEmpty(data.username) ? data.username : '';
  data.password = !isEmpty(data.password) ? data.password : '';
  data.confirm_password = !isEmpty(data.confirm_password) ? data.confirm_password : '';
  data.reset = !isEmpty(data.reset) ? data.reset : '';

  if (method === 'POST') {
    if (path === '/register') {
      if (Validator.isEmpty(data.username)) {
        errors.username = 'username cannot be empty.';
      } else {
        if (!Validator.isLength(data.username, {
            min: 4,
            max: 20
          })) {
          errors.username = 'username must be at least 4 characters but not more than 20 characters.';
        }
      }

      if (Validator.isEmpty(data.password)) {
        errors.password = 'password cannot be empty.';
      } else {
        if (Validator.isEmpty(data.reset)) {
          if (!Validator.isStrongPassword(data.password, {
              minLength: 8,
              minLowercase: 1,
              minUppercase: 1,
              minNumbers: 1,
              minSymbols: 1
            })) {
            errors.password = 'password must be at least 8 characters and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol.';
          }
        }
      }

      if (Validator.isEmpty(data.confirm_password)) {
        errors.confirm_password = 'confirm password cannot be empty.';
      } else {
        if (!Validator.equals(data.password, data.confirm_password)) {
          errors.confirm_password = 'password and confirm password do not match.';
        }
      }

      if (!Validator.isEmpty) {
        if (!Validator.isIn(["YA", "TIDAK"])) {
          error.reset = 'input reset tidak valid.'
        }
      }
    }

    if (path === '/login') {
      if (Validator.isEmpty(data.username)) {
        errors.username = 'username cannot be empty.';
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