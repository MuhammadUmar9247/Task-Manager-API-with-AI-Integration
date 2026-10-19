const express = require('express');
const { planTask } = require('../controllers/ai.controller');

const router = express.Router();

router.post('/plan-task', planTask);

module.exports = router;
