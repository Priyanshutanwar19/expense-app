const expenseDao = require('../dao/expenseDao');
const groupDao = require('../dao/groupDao');

const expenseController = {
    addExpense: async (request, response) => {
        try {
            const { title, description, amount, currency, groupId, splits, excludedMembers, category } = request.body;
            const user = request.user;

            // Verify user is member of the group
            const group = await groupDao.getGroupById(groupId);
            if (!group) {
                return response.status(404).json({ message: "Group not found" });
            }

            if (!group.membersEmail.includes(user.email)) {
                return response.status(403).json({ message: "You are not a member of this group" });
            }

            const expenseData = {
                title,
                description,
                amount,
                currency: currency || 'INR',
                groupId,
                paidBy: user.email,
                splits: splits || [],
                excludedMembers: excludedMembers || [],
                category
            };

            const newExpense = await expenseDao.createExpense(expenseData);
            
            response.status(201).json({
                message: "Expense added successfully",
                expense: newExpense
            });
        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Error adding expense" });
        }
    },

    getExpenses: async (request, response) => {
        try {
            const { groupId, page = 1, limit = 10 } = request.query;
            const user = request.user;

            // Verify user is member of the group
            const group = await groupDao.getGroupById(groupId);
            if (!group) {
                return response.status(404).json({ message: "Group not found" });
            }

            if (!group.membersEmail.includes(user.email)) {
                return response.status(403).json({ message: "You are not a member of this group" });
            }

            const { expenses, totalCount } = await expenseDao.getExpensesByGroupIdPaginated(
                groupId, 
                parseInt(limit), 
                (parseInt(page) - 1) * parseInt(limit)
            );

            response.status(200).json({
                expenses,
                pagination: {
                    totalItems: totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    currentPage: parseInt(page),
                    itemsPerPage: parseInt(limit)
                }
            });
        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Error fetching expenses" });
        }
    },

    getExpenseById: async (request, response) => {
        try {
            const { expenseId } = request.params;
            const user = request.user;

            const expense = await expenseDao.getExpenseById(expenseId);
            if (!expense) {
                return response.status(404).json({ message: "Expense not found" });
            }

            // Verify user is member of the group
            const group = await groupDao.getGroupById(expense.groupId);
            if (!group || !group.membersEmail.includes(user.email)) {
                return response.status(403).json({ message: "Access denied" });
            }

            response.status(200).json(expense);
        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Error fetching expense" });
        }
    },

    updateExpense: async (request, response) => {
        try {
            const { expenseId } = request.params;
            const { title, description, amount, splits, excludedMembers, category } = request.body;
            const user = request.user;

            const expense = await expenseDao.getExpenseById(expenseId);
            if (!expense) {
                return response.status(404).json({ message: "Expense not found" });
            }

            // Verify user is admin of the group or paid by the user
            const group = await groupDao.getGroupById(expense.groupId);
            if (!group || (!group.adminEmail.includes(user.email) && expense.paidBy !== user.email)) {
                return response.status(403).json({ message: "You can only update expenses you created or paid for" });
            }

            const updateData = {
                title,
                description,
                amount,
                splits,
                excludedMembers,
                category
            };

            const updatedExpense = await expenseDao.updateExpense(expenseId, updateData);
            
            response.status(200).json({
                message: "Expense updated successfully",
                expense: updatedExpense
            });

            // Refresh credits after successful operations
            const { refreshCredits } = require('../context/CreditsContext');
            refreshCredits();
        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Error updating expense" });
        }
    },

    deleteExpense: async (request, response) => {
        try {
            const { expenseId } = request.params;
            const user = request.user;

            const expense = await expenseDao.getExpenseById(expenseId);
            if (!expense) {
                return response.status(404).json({ message: "Expense not found" });
            }

            // Verify user is admin of the group or paid by the user
            const group = await groupDao.getGroupById(expense.groupId);
            if (!group || (!group.adminEmail.includes(user.email) && expense.paidBy !== user.email)) {
                return response.status(403).json({ message: "You can only delete expenses you created or paid for" });
            }

            await expenseDao.deleteExpense(expenseId);
            
            response.status(200).json({ message: "Expense deleted successfully" });
        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Error deleting expense" });
        }
    },

    getGroupBalance: async (request, response) => {
        try {
            const { groupId } = request.params;
            const user = request.user;

            // Verify user is member of the group
            const group = await groupDao.getGroupById(groupId);
            if (!group || !group.membersEmail.includes(user.email)) {
                return response.status(403).json({ message: "You are not a member of this group" });
            }

            const balances = await expenseDao.getGroupBalance(groupId);
            
            response.status(200).json({
                balances,
                groupId
            });
        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Error fetching group balance" });
        }
    },

    settleGroup: async (request, response) => {
        try {
            const { groupId } = request.params;
            const user = request.user;
            
            console.log('Settle group request:', { groupId, userEmail: user.email });

            // Verify user is admin of the group
            const group = await groupDao.getGroupById(groupId);
            if (!group || !group.adminEmail.includes(user.email)) {
                console.log('User not admin:', { user: user.email, adminEmail: group.adminEmail });
                return response.status(403).json({ message: "Only group admins can settle expenses" });
            }

            console.log('User is admin, proceeding with settlement');

            // Get all expenses for this group
            const expensesResult = await expenseDao.getExpensesByGroupId(groupId);
            const expenses = expensesResult.expenses || [];
            console.log('Found expenses:', expenses.length);
            
            // Settle all expenses
            const settledExpenses = await Promise.all(
                expenses.map(expense => expenseDao.settleExpense(expense._id))
            );
            console.log('Settled expenses:', settledExpenses.length);

            // Update group payment status
            await groupDao.updateGroup(groupId, {
                paymentStatus: {
                    ...group.paymentStatus,
                    isPaid: true,
                    date: new Date()
                }
            });
            console.log('Updated group payment status');

            response.status(200).json({
                message: "Group settled successfully",
                settledExpenses: settledExpenses.map(e => e._id)
            });
        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Error settling group" });
        }
    },
};

module.exports = expenseController;
