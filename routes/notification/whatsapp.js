/* Libraries */
const router = require('express').Router();

/* Controller */
const Controller = require('../../controllers/notification/whatsapp');

/* Middleware */
const isAuth = require('../../middleware/isAuth');

/**
 * Endpoint CRUD WhatsApp Notification
 */

// ===============================
// ROUTE DENGAN ID_EVENT (TOKEN DATABASE)
// ===============================

// Route untuk mengirim pesan tunggal dengan token dari database
// POST /api/notification/whatsapp/send
router.post('/send', isAuth, Controller.send);

// Route untuk mengirim pesan bulk (multiple target) dengan token dari database
// POST /api/notification/whatsapp/send-bulk
router.post('/send-bulk', isAuth, Controller.sendBulk);

// Route untuk mengirim polling dengan token dari database
// POST /api/notification/whatsapp/send-poll
router.post('/send-poll', isAuth, Controller.sendPoll);

// Route untuk mengirim lokasi dengan token dari database
// POST /api/notification/whatsapp/send-location
router.post('/send-location', isAuth, Controller.sendLocation);

// Send to single user dengan token dari database
// POST /api/notification/whatsapp/send-to-user
router.post('/send-to-user', isAuth, Controller.sendToUser);

// Send to multiple users dengan token dari database
// POST /api/notification/whatsapp/send-to-users
router.post('/send-to-users', isAuth, Controller.sendToUsers);

// ===============================
// ROUTE BARU TANPA ID_EVENT (TOKEN ENVIRONMENT VARIABLE)
// ===============================

// Route untuk mengirim pesan tunggal dengan token dari environment variable (Cara 1)
// POST /api/notification/whatsapp/send-with-env-token
router.post('/send-with-env-token', isAuth, Controller.sendWithEnvToken);

// Route untuk mengirim pesan tunggal dengan token dari environment variable (Cara 2)
// POST /api/notification/whatsapp/send-with-env
router.post('/send-with-env', isAuth, Controller.sendWithEnv);

// Route untuk mengirim pesan bulk dengan token dari environment variable
// POST /api/notification/whatsapp/send-bulk-with-env
router.post('/send-bulk-with-env', isAuth, Controller.sendBulkWithEnv);

// Route untuk mengirim polling dengan token dari environment variable
// POST /api/notification/whatsapp/send-poll-with-env
router.post('/send-poll-with-env', isAuth, Controller.sendPollWithEnv);

// Route untuk mengirim lokasi dengan token dari environment variable
// POST /api/notification/whatsapp/send-location-with-env
router.post('/send-location-with-env', isAuth, Controller.sendLocationWithEnv);

// Send to single user dengan token dari environment variable
// POST /api/notification/whatsapp/send-to-user-with-env
router.post('/send-to-user-with-env', isAuth, Controller.sendToUserWithEnv);

// Send to multiple users dengan token dari environment variable
// POST /api/notification/whatsapp/send-to-users-with-env
router.post('/send-to-users-with-env', isAuth, Controller.sendToUsersWithEnv);

module.exports = router;
