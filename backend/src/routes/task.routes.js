const router = require('express').Router();
const {
  getTasks, createTask, getTask, updateTask, deleteTask,
  addComment, deleteComment, taskValidators,
} = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { body } = require('express-validator');

router.use(authenticate);

router.get('/', getTasks);
router.post('/', taskValidators, validate, createTask);
router.get('/:id', getTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

// Comments
router.post('/:id/comments', [body('content').trim().notEmpty()], validate, addComment);
router.delete('/:id/comments/:commentId', deleteComment);

module.exports = router;
