/* Helpers */
const response = require('../helpers/response');
/* Validation */
const isEmpty = require('../validation/is-empty');

module.exports = async (req, res, next) => {
    /* Validation */
    if (isEmpty(req.params.id) || req.params.id === ':id') {
        let message = "id cannot be empty.";
        let json = {};
        return response.sc400(message, json, res);
    }

    next();
};