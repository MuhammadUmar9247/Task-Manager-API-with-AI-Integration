const mongoose = require('mongoose');
const Task = require('../models/task.model');

// @desc    Create a new task
// @route   POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, dueDate } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    const task = await Task.create({
      title,
      description,
      status,
      dueDate,
    });

    return res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
const getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Get a single task by ID
// @route   GET /api/tasks/:id
const getTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const { title, description, status, dueDate } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;

    const updatedTask = await task.save();

    return res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    await task.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
};
