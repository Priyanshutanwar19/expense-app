const Expense = require("../model/expense");

const expenseDao = {
    createExpense: async (expenseData) => {
        const newExpense = new Expense(expenseData);
        return await newExpense.save();
    },

    getExpensesByGroupId: async (groupId) => {
        return await Expense.find({ groupId }).sort({ createdAt: -1 });
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

    getGroupBalance: async (groupId) => {
        const expenses = await Expense.find({ groupId });
        
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

                    // Add to what they owe
                    balanceMap[split.email].owes += split.amount;

                    // If they paid, add to their credit
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
    }
};

module.exports = expenseDao;
