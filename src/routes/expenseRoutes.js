const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');
const expenseController = require('../controllers/expenseController');

router.use(authMiddleware.protect);

router.post(
    '/add',
    authorizeMiddleware('expense:create'),
    expenseController.addExpense
);

router.get(
    '/:groupId/list',
    authorizeMiddleware('expense:view'),
    expenseController.getExpenses
);

router.get(
    '/:groupId/balance',
    authorizeMiddleware('expense:view'),
    expenseController.getGroupBalance
);

router.delete(
    '/:expenseId',
    authorizeMiddleware('expense:delete'),
    expenseController.deleteExpense
);

router.post(
    '/:groupId/settle',
    authorizeMiddleware('expense:settle'),
    expenseController.settleGroup
);

module.exports = router;
