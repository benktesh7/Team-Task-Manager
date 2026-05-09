const router = require('express').Router();
const { getNotifications, markAllRead, markRead } = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

module.exports = router;
