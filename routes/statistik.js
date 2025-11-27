/* Libraries */
const router = require('express').Router();
/* Controller */
const Controller = require('../controllers/statistik');

router.get('/dashboard/', Controller.dashboard);
router.get('/event/', Controller.s1);
router.get('/formulir/', Controller.s2);

module.exports = router;
