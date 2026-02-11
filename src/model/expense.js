const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    category: {
        type: String,
        enum: ['food', 'transport', 'accommodation', 'entertainment', 'shopping', 'utilities', 'healthcare', 'other'],
        default: 'other'
    },
    paidBy: {
        type: String,
        required: true
    },
    splits: [{
        email: String,
        amount: Number,
        paidAmount: {
            type: Number,
            default: 0
        },
        isExcluded: {
            type: Boolean,
            default: false
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    isSettled: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Expense', expenseSchema);
