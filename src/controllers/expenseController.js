const expenseDao = require("../dao/expenseDao");
const groupDao = require("../dao/groupDao");
const Group = require("../model/group");

const expenseController = {
    addExpense: async (request, response) => {
        try {
            const { groupId, title, description, amount, splits } = request.body;
            const userEmail = request.user.email;

            // Validate group exists and user is a member
            const group = await groupDao.getGroupById(groupId);

            if (!group) {
                return response.status(404).json({ message: "Group not found" });
            }

            if (!group.membersEmail.includes(userEmail)) {
                return response.status(403).json({ 
                    message: "You are not a member of this group" 
                });
            }

            // Validate amount
            if (amount <= 0) {
                return response.status(400).json({ 
                    message: "Expense amount must be greater than 0" 
                });
            }

            // Validate splits
            if (!splits || splits.length === 0) {
                return response.status(400).json({ 
                    message: "At least one member must be included in the expense" 
                });
            }

            const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);
            
            if (Math.abs(totalSplitAmount - amount) > 0.01) {
                return response.status(400).json({ 
                    message: "Split amounts must equal the expense amount" 
                });
            }

            const expenseData = {
                groupId,
                title,
                description,
                amount,
                currency: 'INR',
                paidBy: userEmail,
                splits
            };

            const newExpense = await expenseDao.createExpense(expenseData);
            
            response.status(201).json({
                message: "Expense added successfully",
                expense: newExpense
            });

        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    },

    getExpenses: async (request, response) => {
        try {
            const { groupId } = request.params;
            const page = parseInt(request.query.page) || 1;
            const limit = parseInt(request.query.limit) || 10;
            const skip = (page - 1) * limit;

            const group = await groupDao.getGroupById(groupId);
            if (!group) {
                return response.status(404).json({ message: "Group not found" });
            }

            const { expenses, totalCount } = await expenseDao.getExpensesByGroupIdPaginated(
                groupId, 
                limit, 
                skip
            );

            response.status(200).json({
                expenses,
                pagination: {
                    totalItems: totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    currentPage: page,
                    itemsPerPage: limit
                }
            });

        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Error fetching expenses" });
        }
    },

    getGroupBalance: async (request, response) => {
        try {
            const { groupId } = request.params;

            const group = await groupDao.getGroupById(groupId);
            if (!group) {
                return response.status(404).json({ message: "Group not found" });
            }

            const balances = await expenseDao.getGroupBalance(groupId);

            response.status(200).json({
                groupId,
                balances
            });

        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Error calculating balances" });
        }
    },

    settleGroup: async (request, response) => {
        try {
            const { groupId } = request.params;
            const userEmail = request.user.email;

            const group = await groupDao.getGroupById(groupId);

            if (!group) {
                return response.status(404).json({ message: "Group not found" });
            }

            if (group.adminEmail !== userEmail) {
                return response.status(403).json({ 
                    message: "Only group admin can settle the group" 
                });
            }

            // Delete all expenses for this group
            const Expense = require("../model/expense");
            await Expense.deleteMany({ groupId });

            // Update group payment status
            const updatedGroup = await Group.findByIdAndUpdate(
                groupId,
                {
                    paymentStatus: {
                        amount: 0,
                        currency: 'INR',
                        date: new Date(),
                        isPaid: true
                    }
                },
                { new: true }
            );

            response.status(200).json({
                message: "Group settled successfully",
                group: updatedGroup
            });

        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Error settling group" });
        }
    },

    deleteExpense: async (request, response) => {
        try {
            const { expenseId } = request.params;
            const userEmail = request.user.email;

            const expense = await expenseDao.getExpenseById(expenseId);
            if (!expense) {
                return response.status(404).json({ message: "Expense not found" });
            }

            if (expense.paidBy !== userEmail) {
                return response.status(403).json({ 
                    message: "Only the person who added the expense can delete it" 
                });
            }

            await expenseDao.deleteExpense(expenseId);

            response.status(200).json({ 
                message: "Expense deleted successfully" 
            });

        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Error deleting expense" });
        }
    }
};

module.exports = expenseController;
