/* Libraries */
const router = require('express').Router();
/* Controller */
const Controller = require('../controllers/cronejob');

router.get('/cj1', Controller.cj1);
router.get('/cj2', Controller.cj2);
router.get('/cj3', Controller.cj3);
router.get('/cj4', Controller.cj4);
router.get('/cj5', Controller.cj5);
router.get('/cj6', Controller.cj6);
router.get('/cj7', Controller.cj7);
router.get('/cj8', Controller.cj8);
router.get('/cj9', Controller.cj9);

module.exports = router;
