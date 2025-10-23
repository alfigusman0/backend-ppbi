/* Libraries */
const router = require('express').Router();

/* Controller */
const Controller = require('../../controllers/notification/whatsapp');

/* Middleware */
const isAuth = require('../../middleware/isAuth');

/**
 * Endpoint CRUD WhatsApp Notification
 */

// Route untuk mengirim pesan tunggal
// POST /api/notification/whatsapp/send
router.post('/send', isAuth, Controller.send);

// Route untuk mengirim pesan bulk (multiple target)
// POST /api/notification/whatsapp/send-bulk
router.post('/send-bulk', isAuth, Controller.sendBulk);

// Route untuk mengirim polling
// POST /api/notification/whatsapp/send-poll
router.post('/send-poll', isAuth, Controller.sendPoll);

// Route untuk mengirim lokasi
// POST /api/notification/whatsapp/send-location
router.post('/send-location', isAuth, Controller.sendLocation);

// Send to single user
// POST /api/notification/whatsapp/send-to-user
router.post('/send-to-user', isAuth, Controller.sendToUser);

// Send to multiple users
// POST /api/notification/whatsapp/send-to-users
router.post('/send-to-users', isAuth, Controller.sendToUsers);

module.exports = router;