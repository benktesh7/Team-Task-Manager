const router = require('express').Router();
const { getUsers, getUser, updateMe, updateUserRole, deleteUser } = require('../controllers/user.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', requireAdmin, getUsers);
router.get('/:id', getUser);
router.patch('/me', updateMe);
router.patch('/:id/role', requireAdmin, updateUserRole);
router.delete('/:id', requireAdmin, deleteUser);

module.exports = router;
