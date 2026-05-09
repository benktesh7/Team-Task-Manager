const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { asyncHandler } = require('../middleware/error.middleware');

// GET /api/users  (admin only)
const getUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: users });
});

// GET /api/users/:id
const getUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
});

// PATCH /api/users/me
const updateMe = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;
  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { ...(name && { name }), ...(avatar !== undefined && { avatar }) },
    select: { id: true, name: true, email: true, role: true, avatar: true, updatedAt: true },
  });
  res.json({ success: true, message: 'Profile updated', data: updated });
});

// PATCH /api/users/:id/role  (admin only)
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['ADMIN', 'MEMBER'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });
  res.json({ success: true, message: 'Role updated', data: updated });
});

// DELETE /api/users/:id  (admin only)
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
  }
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'User deleted' });
});

module.exports = { getUsers, getUser, updateMe, updateUserRole, deleteUser };
