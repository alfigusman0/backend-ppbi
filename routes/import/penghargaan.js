/* Libraries */
const router = require('express').Router();
/* Controller */
const Controller = require('../../controllers/import/penghargaan');
/* Middleware */
const isAuth = require('../../middleware/isAuth');
const upload = require('../../middleware/import.js');
const Validation = require('../../validation/import/penghargaan');

router.post('/preview', isAuth, upload.single('file'), Validation.preview, Controller.preview);
router.post('/process', isAuth, upload.single('file'), Validation.process, Controller.process);
router.get('/template', Controller.template);

module.exports = router;
