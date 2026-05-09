const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, avatar: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

const requireProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) return next();

    // Global admins always pass
    if (req.user.role === 'ADMIN') return next();

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Project admin access required' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    if (!projectId) return next();

    if (req.user.role === 'ADMIN') return next();

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });

    if (!member) {
      return res.status(403).json({ success: false, message: 'Not a member of this project' });
    }

    req.projectMember = member;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate, requireAdmin, requireProjectAdmin, requireProjectMember };
