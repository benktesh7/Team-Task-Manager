const router = require('express').Router();
const {
  getProjects, createProject, getProject, updateProject, deleteProject,
  addMember, removeMember, updateMemberRole, projectValidators,
} = require('../controllers/project.controller');
const { authenticate, requireProjectAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

router.use(authenticate);

router.get('/', getProjects);
router.post('/', projectValidators, validate, createProject);
router.get('/:id', getProject);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

// Members
router.post('/:id/members', requireProjectAdmin, addMember);
router.delete('/:id/members/:userId', requireProjectAdmin, removeMember);
router.patch('/:id/members/:userId', requireProjectAdmin, updateMemberRole);

module.exports = router;
