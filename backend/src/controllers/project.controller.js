const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const { asyncHandler } = require('../middleware/error.middleware');

// GET /api/projects
const getProjects = asyncHandler(async (req, res) => {
  const { archived } = req.query;
  const isArchived = archived === 'true';

  let projects;
  if (req.user.role === 'ADMIN') {
    projects = await prisma.project.findMany({
      where: { isArchived },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } else {
    projects = await prisma.project.findMany({
      where: {
        isArchived,
        members: { some: { userId: req.user.id } },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Attach task stats
  const enriched = await Promise.all(projects.map(async (p) => {
    const stats = await prisma.task.groupBy({
      by: ['status'],
      where: { projectId: p.id },
      _count: true,
    });
    const taskStats = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
    stats.forEach(s => { taskStats[s.status] = s._count; });
    return { ...p, taskStats };
  }));

  res.json({ success: true, data: enriched });
});

// POST /api/projects
const createProject = asyncHandler(async (req, res) => {
  const { name, description, color, dueDate } = req.body;

  const project = await prisma.project.create({
    data: {
      name, description, color: color || '#6366f1',
      dueDate: dueDate ? new Date(dueDate) : null,
      ownerId: req.user.id,
      members: {
        create: { userId: req.user.id, role: 'ADMIN' },
      },
    },
    include: {
      owner: { select: { id: true, name: true, email: true, avatar: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
      _count: { select: { tasks: true } },
    },
  });

  res.status(201).json({ success: true, message: 'Project created', data: project });
});

// GET /api/projects/:id
const getProject = asyncHandler(async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, name: true, email: true, avatar: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true, avatar: true } },
          creator: { select: { id: true, name: true, email: true, avatar: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  // Check access
  if (req.user.role !== 'ADMIN') {
    const isMember = project.members.some(m => m.userId === req.user.id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });
  }

  res.json({ success: true, data: project });
});

// PATCH /api/projects/:id
const updateProject = asyncHandler(async (req, res) => {
  const { name, description, color, dueDate, isArchived } = req.body;

  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  // Only owner or global admin can update
  if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Only the project owner can update this project' });
  }

  const updated = await prisma.project.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(color && { color }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(isArchived !== undefined && { isArchived }),
    },
    include: {
      owner: { select: { id: true, name: true, email: true, avatar: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
    },
  });

  res.json({ success: true, message: 'Project updated', data: updated });
});

// DELETE /api/projects/:id
const deleteProject = asyncHandler(async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Only the project owner can delete this project' });
  }

  await prisma.project.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Project deleted' });
});

// POST /api/projects/:id/members
const addMember = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const projectId = req.params.id;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ success: false, message: 'User not found with that email' });

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (existing) return res.status(409).json({ success: false, message: 'User is already a member' });

  const member = await prisma.projectMember.create({
    data: { projectId, userId: user.id, role: role || 'MEMBER' },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });

  res.status(201).json({ success: true, message: 'Member added', data: member });
});

// DELETE /api/projects/:id/members/:userId
const removeMember = asyncHandler(async (req, res) => {
  const { id: projectId, userId } = req.params;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  if (project.ownerId === userId) {
    return res.status(400).json({ success: false, message: 'Cannot remove the project owner' });
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });

  res.json({ success: true, message: 'Member removed' });
});

// PATCH /api/projects/:id/members/:userId
const updateMemberRole = asyncHandler(async (req, res) => {
  const { id: projectId, userId } = req.params;
  const { role } = req.body;

  const updated = await prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId } },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });

  res.json({ success: true, message: 'Member role updated', data: updated });
});

const projectValidators = [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 200 }),
  body('color').optional().isHexColor().withMessage('Invalid color hex'),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date'),
];

module.exports = {
  getProjects, createProject, getProject, updateProject, deleteProject,
  addMember, removeMember, updateMemberRole, projectValidators,
};
