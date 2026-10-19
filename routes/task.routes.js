const express = require('express');
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
} = require('../controllers/task.controller');

const router = express.Router();

router.route('/').post(createTask).get(getTasks);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);

module.exports = router;
