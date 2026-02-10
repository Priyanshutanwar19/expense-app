require('dotenv').config();

const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./src/routes/authRoutes');
const groupRoutes= require('./src/routes/groupRoutes');
const groupDao= require('./src/dao/groupDao');
const cookieParser = require('cookie-parser');
const rbacRoutes = require('./src/routes/rbacRoutes');
const paymentsRoutes = require('./src/routes/paymentRoutes');
const profileRoutes = require('./src/routes/profileRoutes');

mongoose.connect(process.env.MONGO_DB_CONNECTION_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(error => {console.log('MongoDB connection error:', error);});

const app = express();

app.use(express.json());  //Middleware5
app.use(cookieParser());
app.use(cors({
    origin:process.env.CLIENT_URL,
    credentials: true
}))

app.use('/auth',authRoutes);
app.use('/group',groupRoutes);
app.use('/users', rbacRoutes);
app.use('/payments', paymentsRoutes);
app.use('/profile', profileRoutes);


app.listen(5001, () => {
    console.log('Server is running on port 5001');
});