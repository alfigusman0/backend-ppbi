/* Libraries */
const router = require('express').Router();
/* Controller */
const Controller = require('../controllers/auth');
/* Middleware */
const isAuth = require('../middleware/isAuth');
const validation = require('../middleware/auth');

router.post('/login', validation, Controller.login);
router.post('/register', validation, Controller.register);
router.get('/logout', isAuth, Controller.logout);
router.get('/cek', isAuth, Controller.checkToken);
router.get('/google', Controller.google);
router.get('/google/callback', Controller.callback);
router.post('/token', isAuth, Controller.refreshToken);
router.post('/token/create', Controller.createToken);
router.delete('/token', isAuth, Controller.deleteToken);

module.exports = router;