/* Libraries */
const router = require('express').Router();
/* Controller */
const Controller = require('../../controllers/import/penilaian.js');
/* Middleware */
const isAuth = require('../../middleware/isAuth.js');
const upload = require('../../middleware/import.js');
const Validation = require('../../validation/import/penilaian.js');

router.post('/preview', isAuth, upload.single('file'), Validation.preview, Controller.preview);
router.post('/process', isAuth, upload.single('file'), Validation.process, Controller.process);
router.get('/template', Controller.template);

module.exports = router;
