const router = require('express').Router();
const { signup, login, getMe, changePassword, signupValidators, loginValidators } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { body } = require('express-validator');

router.post('/signup', signupValidators, validate, signup);
router.post('/login', loginValidators, validate, login);
router.get('/me', authenticate, getMe);
router.patch('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], validate, changePassword);

module.exports = router;
