const Expense = require("../model/expense");

const expenseDao = {
    createExpense: async (data) => {
        const newExpense = new Expense(data);
        return await newExpense.save();
    },

    getExpensesByGroupId: async (groupId, page = 1, limit = 10, sortOptions = { createdAt: -1 }) => {
        const skip = (page - 1) * limit;
        
        const [expenses, totalCount] = await Promise.all([
            Expense.find({ groupId })
                .sort(sortOptions)
                .skip(skip)
                .limit(limit),
            Expense.countDocuments({ groupId })
        ]);

        return { expenses, totalCount };
    },

    getExpensesByGroupIdPaginated: async (groupId, limit, skip, sortOptions = { createdAt: -1 }) => {
        const [expenses, totalCount] = await Promise.all([
            Expense.find({ groupId })
                .sort(sortOptions)
                .skip(skip)
                .limit(limit),
            Expense.countDocuments({ groupId })
        ]);

        return { expenses, totalCount };
    },

    getExpenseById: async (expenseId) => {
        return await Expense.findById(expenseId);
    },

    updateExpense: async (expenseId, updateData) => {
        return await Expense.findByIdAndUpdate(expenseId, updateData, { new: true });
    },

    deleteExpense: async (expenseId) => {
        return await Expense.findByIdAndDelete(expenseId);
    },

    getGroupBalance: async (groupId) => {
        // Only get unsettled expenses for balance calculation
        const expenses = await Expense.find({ groupId, isSettled: false });
        
        const balanceMap = {};
        
        expenses.forEach(expense => {
            expense.splits.forEach(split => {
                if (!split.isExcluded) {
                    if (!balanceMap[split.email]) {
                        balanceMap[split.email] = {
                            email: split.email,
                            owes: 0,
                            credit: 0
                        };
                    }
                    
                    balanceMap[split.email].owes += split.amount;
                    
                    if (split.email === expense.paidBy) {
                        balanceMap[split.email].credit += split.amount;
                    }
                }
            });
        });

        // Calculate net balance
        const balances = Object.values(balanceMap).map(balance => ({
            ...balance,
            netBalance: balance.credit - balance.owes
        }));

        return balances;
    },

    settleExpense: async (expenseId) => {
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            throw new Error('Expense not found');
        }

        // Mark all members as paid up
        expense.splits.forEach(split => {
            split.paidAmount = split.amount;
        });

        // Mark expense as settled
        expense.isSettled = true;
        await expense.save();

        return expense;
    }
};

module.exports = expenseDao;
