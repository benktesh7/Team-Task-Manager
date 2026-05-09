const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const { asyncHandler } = require('../middleware/error.middleware');
const { validate } = require('../middleware/validate.middleware');

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Validators
const signupValidators = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidators = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already in use' });
  }

  const hashed = await bcrypt.hash(password, 12);

  // First user becomes ADMIN
  const userCount = await prisma.user.count();
  const assignedRole = userCount === 0 ? 'ADMIN' : (role === 'ADMIN' ? 'ADMIN' : 'MEMBER');

  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: assignedRole },
    select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
  });

  const token = signToken(user.id);
  res.status(201).json({ success: true, message: 'Account created', data: { token, user } });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = signToken(user.id);
  const { password: _, ...safeUser } = user;
  res.json({ success: true, message: 'Login successful', data: { token, user: safeUser } });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true, updatedAt: true },
  });
  res.json({ success: true, data: user });
});

// PATCH /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

  res.json({ success: true, message: 'Password updated successfully' });
});

module.exports = { signup, login, getMe, changePassword, signupValidators, loginValidators };
