/* Libraries */
const router = require('express').Router();

/* Controller */
const Controller = require('../../controllers/notification/index');

/* Middleware */
const isAuth = require('../../middleware/isAuth');

/**
 * Endpoint untuk notification management
 */

// Create single notification
// POST /api/notification/create
router.post('/create', isAuth, Controller.create);

// Create bulk notification
// POST /api/notification/create-bulk
router.post('/create-bulk', isAuth, Controller.createBulk);

// Get user notifications (in-app)
// GET /api/notification/user/:page/:limit
router.get('/user/:page/:limit', isAuth, Controller.getUserNotifications);

// Mark single notification as read
// PUT /api/notification/:id/read
router.put('/:id/read', isAuth, Controller.markAsRead);

// Bulk mark as read
// PUT /api/notification/bulk-read
router.put('/bulk-read', isAuth, Controller.markMultipleAsRead);

// Import WhatsApp routes
const whatsappRoutes = require('./whatsapp');
router.use('/whatsapp', whatsappRoutes);

module.exports = router;