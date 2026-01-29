const express = require('express');
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middlewares.js/authMiddleware');

const router = express.Router();
router.post('/create', authMiddleware.protect, groupController.createGroup);

module.exports = router;