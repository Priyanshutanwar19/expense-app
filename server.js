const express = require('express');

const app = express();

app.use(express.json());//middleware

let users = [];

app.post('/register', (request, response) => {
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
});


//create a post api with path/login which takes in email and paassword from body and checks i f user with
//same email and password exist in the user array . If yes return 200 response otherwise 400 response
app.post('/login', (request,response)=>{
    const {email,password}=request.body;
    if(!email || !password){
        return response.status(400).json({
            message: 'Email,password are required',
        });
    }

    const user = users.find((user)=>{
        if(user.email=== email && user.password===password){
            return user;
        }
    });
    if(!user){
        return response.status(400).json({
            message: 'Email or password incorrect',
        });
    }
    return response.status(200).json({
        message:'Login Successful',
    });
    
})
app.listen(5001, () => {
    console.log("Server is running on port 5001");
});
