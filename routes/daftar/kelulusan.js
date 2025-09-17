/* Libraries */
const router = require('express').Router();
/* Controller */
const Controller = require('../../controllers/daftar/kelulusan');
/* Middleware */
const isAuth = require('../../middleware/isAuth');
const paramsid = require('../../middleware/params-id');
const validation = require('../../middleware/daftar/kelulusan');

router.get('/', isAuth, Controller.read);
router.post('/', isAuth, validation, Controller.create);
router.put('/:id', isAuth, paramsid, validation, Controller.update);
router.delete('/:id', isAuth, paramsid, Controller.delete);
router.get('/single', isAuth, Controller.single);

module.exports = router;