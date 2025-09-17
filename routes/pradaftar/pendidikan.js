/* Libraries */
const router = require('express').Router();
/* Controller */
const Controller = require('../../controllers/pradaftar/pendidikan');
/* Middleware */
const isAuth = require('../../middleware/isAuth');
const validation = require('../../middleware/pradaftar/pendidikan');
const paramsid = require('../../middleware/params-id');

router.get('/', isAuth, Controller.read);
//router.post('/', isAuth, validation, Controller.create);
//router.put('/:id', isAuth, paramsid, validation, Controller.update);
//router.delete('/:id', isAuth, paramsid, Controller.delete);
router.get('/single', isAuth, Controller.single);

module.exports = router;