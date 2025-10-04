/* Libraries */
const router = require('express').Router();
/* Controller */
const Controller = require('../controllers/cronejob');

router.get('/cj1', Controller.cj1);
router.get('/cj2', Controller.cj2);
router.get('/cj3', Controller.cj3);

module.exports = router;