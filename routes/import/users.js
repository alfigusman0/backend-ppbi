/* Libraries */
const router = require('express').Router();
/* Controller */
const Controller = require('../../controllers/import/users');
/* Middleware */
const isAuth = require('../../middleware/isAuth');
const upload = require('../../middleware/import.js');

router.post('/preview', isAuth, upload.single('file'), Controller.preview);
router.post('/process', isAuth, upload.single('file'), Controller.process);
router.get('/template', Controller.template);

module.exports = router;
