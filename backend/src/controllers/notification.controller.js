const prisma = require('../lib/prisma');
const { asyncHandler } = require('../middleware/error.middleware');

// GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    include: { task: { select: { id: true, title: true, projectId: true } } },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  const unreadCount = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });
  res.json({ success: true, data: notifications, unreadCount });
});

// PATCH /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
  res.json({ success: true, message: 'All notifications marked as read' });
});

// PATCH /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
  res.json({ success: true, message: 'Notification marked as read' });
});

module.exports = { getNotifications, markAllRead, markRead };
