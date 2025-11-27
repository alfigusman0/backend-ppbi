/* Libraries */
const router = require('express').Router();
/* Controller */
const Controller = require('../controllers/statistik');

router.get('/dashboard/', Controller.dashboard);
router.get('/event/', Controller.s1);

module.exports = router;
