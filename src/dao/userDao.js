const User = require('../model/users');

const userDao = {
    findByEmail: async (email) => {
        try {
            const user = await User.findOne({ email });
            return user;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw {
                code: 'DATABASE_ERROR',
                message: 'Failed to find user by email'
            };
        }
    },

    create: async (userData) => {
        const newUser = new User(userData);
        try {
            await newUser.save();
            return newUser;
        } catch (error) {
            if (error.code === 11000) {
                throw {
                    code: 'USER_EXIST',
                    message: 'A user with this email already exists'
                };
            } else {
                console.error('Error creating user:', error);
                throw {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Something went wrong while communicating with the database'
                };
            }
        }
    }
};

module.exports = userDao;