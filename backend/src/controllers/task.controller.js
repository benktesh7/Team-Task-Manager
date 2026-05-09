const { body, query } = require('express-validator');
const prisma = require('../lib/prisma');
const { asyncHandler } = require('../middleware/error.middleware');

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true, avatar: true } },
  creator: { select: { id: true, name: true, email: true, avatar: true } },
  project: { select: { id: true, name: true, color: true } },
  _count: { select: { comments: true } },
};

// GET /api/tasks  (with filters)
const getTasks = asyncHandler(async (req, res) => {
  const { projectId, status, priority, assigneeId, search, page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {};

  if (req.user.role !== 'ADMIN') {
    // Only tasks in projects the user belongs to
    const memberProjects = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      select: { projectId: true },
    });
    where.projectId = { in: memberProjects.map(m => m.projectId) };
  }

  if (projectId) where.projectId = projectId;
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;
  if (search) where.title = { contains: search };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({ where, include: taskInclude, orderBy: { createdAt: 'desc' }, skip, take: Number(limit) }),
    prisma.task.count({ where }),
  ]);

  res.json({ success: true, data: tasks, meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
});

// POST /api/tasks
const createTask = asyncHandler(async (req, res) => {
  const { title, description, projectId, assigneeId, priority, dueDate, tags, status } = req.body;

  // Verify project membership
  if (req.user.role !== 'ADMIN') {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });
    if (!member) return res.status(403).json({ success: false, message: 'Not a member of this project' });
  }

  // If assigning, verify assignee is a member
  if (assigneeId) {
    const assigneeMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: assigneeId } },
    });
    if (!assigneeMember) return res.status(400).json({ success: false, message: 'Assignee is not a project member' });
  }

  const task = await prisma.task.create({
    data: {
      title, description, projectId, assigneeId: assigneeId || null,
      priority: priority || 'MEDIUM',
      status: status || 'TODO',
      dueDate: dueDate ? new Date(dueDate) : null,
      tags: tags ? JSON.stringify(tags) : null,
      creatorId: req.user.id,
    },
    include: taskInclude,
  });

  // Notify assignee
  if (assigneeId && assigneeId !== req.user.id) {
    await prisma.notification.create({
      data: {
        userId: assigneeId,
        taskId: task.id,
        message: `You were assigned to task "${task.title}"`,
      },
    });
  }

  res.status(201).json({ success: true, message: 'Task created', data: task });
});

// GET /api/tasks/:id
const getTask = asyncHandler(async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: {
      ...taskInclude,
      comments: {
        include: { author: { select: { id: true, name: true, email: true, avatar: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  // Access check
  if (req.user.role !== 'ADMIN') {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } },
    });
    if (!member) return res.status(403).json({ success: false, message: 'Access denied' });
  }

  res.json({ success: true, data: task });
});

// PATCH /api/tasks/:id
const updateTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, assigneeId, dueDate, tags } = req.body;

  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  if (req.user.role !== 'ADMIN') {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } },
    });
    if (!member) return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const prevAssignee = task.assigneeId;

  const updated = await prisma.task.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(tags !== undefined && { tags: tags ? JSON.stringify(tags) : null }),
    },
    include: taskInclude,
  });

  // Notify new assignee
  if (assigneeId && assigneeId !== prevAssignee && assigneeId !== req.user.id) {
    await prisma.notification.create({
      data: {
        userId: assigneeId,
        taskId: updated.id,
        message: `You were assigned to task "${updated.title}"`,
      },
    });
  }

  res.json({ success: true, message: 'Task updated', data: updated });
});

// DELETE /api/tasks/:id
const deleteTask = asyncHandler(async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  if (req.user.role !== 'ADMIN') {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } },
    });
    if (!member || (member.role !== 'ADMIN' && task.creatorId !== req.user.id)) {
      return res.status(403).json({ success: false, message: 'Only task creator or project admin can delete' });
    }
  }

  await prisma.task.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Task deleted' });
});

// POST /api/tasks/:id/comments
const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  const comment = await prisma.comment.create({
    data: { content, taskId: task.id, authorId: req.user.id },
    include: { author: { select: { id: true, name: true, email: true, avatar: true } } },
  });

  res.status(201).json({ success: true, message: 'Comment added', data: comment });
});

// DELETE /api/tasks/:id/comments/:commentId
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } });
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

  if (comment.authorId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Cannot delete another user\'s comment' });
  }

  await prisma.comment.delete({ where: { id: req.params.commentId } });
  res.json({ success: true, message: 'Comment deleted' });
});

const taskValidators = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 300 }),
  body('projectId').notEmpty().withMessage('Project ID is required'),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date'),
  body('tags').optional().isArray(),
];

module.exports = {
  getTasks, createTask, getTask, updateTask, deleteTask,
  addComment, deleteComment, taskValidators,
};
