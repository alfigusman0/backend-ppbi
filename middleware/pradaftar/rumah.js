/* Helpers */
const response = require('../../helpers/response');
/* Validation */
const validation = require('../../validation/pradaftar/rumah');

module.exports = async (req, res, next) => {
    /* Validation */
    let {
        errors,
        isValid
    } = validation(req.method, req.path, req.body);
    if (!isValid) {
        let message = errors;
        let json = {};
        return response.sc400(message, json, res);
    }

    next();
};