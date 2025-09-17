/* Libraries */
const router = require('express').Router();
/* Controller */
const Controller = require('../controllers/cronejob');

router.get('/cj1', Controller.cj1);

module.exports = router;