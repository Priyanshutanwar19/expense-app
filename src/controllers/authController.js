const { request } = require("express");
const users = require('../dao/userDb');

const authController = {
    register: (request, response) => {
        //copy and paste the content of login here
        const { name, email, password } = request.body;
        if (!name || !email || !password) {
            return response.status(400).json({
                message: 'Name, Email, Password are required'
            });
        }
        //implement a logic to check a user should not register with the already registered email
        //already exists in the users object
        const user = users.find(user => user.email === email);
        if (user) {
            return response.status(400).json({
                message: `User already exist with email: ${email}`
            });
        }
        const newUser = {
            id: users.length + 1,
            name: name,
            email: email,
            password: password,
        };
        users.push(newUser);
        return response.status(200).json({
            message: 'User registered',
            user: { id: newUser.id }
        });
    },
    login: (request, response) => {
        const { email, password } = request.body;
        if (!email || !password) {
            return response.status(400).json({
                message: 'Email,password are required',
            });
        }

        const user = users.find((user) => {
            if (user.email === email && user.password === password) {
                return user;
            }
        });
        if (!user) {
            return response.status(400).json({
                message: 'Email or password incorrect',
            });
        }
        return response.status(200).json({
            message: 'Login Successful',
        });
    }

};
module.exports = authController;