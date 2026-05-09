const prisma = require('../lib/prisma');
const { asyncHandler } = require('../middleware/error.middleware');

// GET /api/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'ADMIN';
  const now = new Date();

  let projectFilter = {};
  let taskFilter = {};

  if (!isAdmin) {
    const memberProjects = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const projectIds = memberProjects.map(m => m.projectId);
    projectFilter = { id: { in: projectIds } };
    taskFilter = { projectId: { in: projectIds } };
  }

  const [totalProjects, totalTasks, tasksByStatus, overdueTasks, myTasks, recentActivity, upcomingDeadlines] =
    await Promise.all([
      prisma.project.count({ where: { ...projectFilter, isArchived: false } }),
      prisma.task.count({ where: taskFilter }),
      prisma.task.groupBy({ by: ['status'], where: taskFilter, _count: true }),
      prisma.task.count({ where: { ...taskFilter, dueDate: { lt: now }, status: { not: 'DONE' } } }),
      prisma.task.findMany({
        where: { assigneeId: userId, status: { not: 'DONE' } },
        include: {
          project: { select: { id: true, name: true, color: true } },
          assignee: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        take: 8,
      }),
      prisma.task.findMany({
        where: taskFilter,
        include: {
          project: { select: { id: true, name: true, color: true } },
          assignee: { select: { id: true, name: true, avatar: true } },
          creator: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      prisma.task.findMany({
        where: {
          ...taskFilter,
          dueDate: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
          status: { not: 'DONE' },
        },
        include: { project: { select: { id: true, name: true, color: true } } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
    ]);

  const statusMap = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
  tasksByStatus.forEach(s => { statusMap[s.status] = s._count; });

  res.json({
    success: true,
    data: {
      stats: {
        totalProjects,
        totalTasks,
        overdueTasks,
        completedTasks: statusMap.DONE,
        inProgressTasks: statusMap.IN_PROGRESS,
        todoTasks: statusMap.TODO,
        inReviewTasks: statusMap.IN_REVIEW,
      },
      tasksByStatus: statusMap,
      myTasks,
      recentActivity,
      upcomingDeadlines,
    },
  });
});

module.exports = { getDashboard };
