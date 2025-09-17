/* Libraries */
const router = require('express').Router();
/* Controller */
const Controller = require('../../controllers/settings/bobot_nilai_ukt');
/* Middleware */
const isAuth = require('../../middleware/isAuth');
const validation = require('../../middleware/settings/bobot_nilai_ukt');
const paramsid = require('../../middleware/params-id');

router.get('/', isAuth, Controller.read);
router.post('/', isAuth, validation, Controller.create);
router.put('/:id', isAuth, paramsid, validation, Controller.update);
router.delete('/:id', isAuth, paramsid, Controller.delete);
router.get('/single', isAuth, Controller.single);

module.exports = router;