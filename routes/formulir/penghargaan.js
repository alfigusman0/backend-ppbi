/* Libraries */
const router = require('express').Router();
/* Controller */
const Controller = require('../../controllers/formulir/penghargaan');
/* Sub Routes */
const importRoutes = require('../import/penghargaan');
/* Middleware */
const isAuth = require('../../middleware/isAuth');
const validation = require('../../middleware/formulir/penghargaan');
const paramsid = require('../../middleware/params-id');

router.get('/bonsai/', isAuth, Controller.read_bonsai);
router.get('/suiseki/', isAuth, Controller.read_suiseki);
router.post('/', isAuth, validation, Controller.create);
router.put('/:id', isAuth, paramsid, validation, Controller.update);
router.delete('/:id', isAuth, paramsid, Controller.delete);
router.get('/bonsai/single', isAuth, Controller.single_bonsai);
router.get('/suiseki/single', isAuth, Controller.single_suiseki);
router.use('/import', importRoutes);

module.exports = router;
