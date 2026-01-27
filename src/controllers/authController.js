const userDao = require('../dao/userDao');
const bcrypt = require('bcrypt');
const authController = {
    login: async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and Password are required!!'
            });
        }

        const user = await userDao.findByEmail(email);

        const isPasswordMatched = await bcrypt.compare(password, user.password);
        if (user && isPasswordMatched) {
            return res.status(200).json({
                message: 'User Authenticated',
                user: { id: user._id, name: user.name, email: user.email }
            });
        } else {
            return res.status(400).json({
                message: 'Invalid email or password'
            });
        }
    },
    register: async (req, res) => {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({
                    message: 'Name, Email, Password are required!!'
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);


            const user = await userDao.create({
                name: name,
                email: email,
                password: hashedPassword
            })



            console.log("after user variable")
            if (!user) {
                console.log("user not created");
                return res.status(400).json({
                    message: 'Inavlid user',

                });
            }

            console.log("User created");

            return res.status(200).json({
                message: 'User registered',
                user: user
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Internal Server Error"
            });
        }
    }
};

module.exports = authController;