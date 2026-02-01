const userDao = require("../dao/userDao");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const authController = {
  // login
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and Password are required!!",
      });
    }

    const user = await userDao.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const accessToken = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "User Authenticated",
      user: { id: user._id, name: user.name, email: user.email },
    });
  },

  // register
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          message: "Name, Email, Password are required!!",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await userDao.create({
        name,
        email,
        password: hashedPassword,
      });

      if (!user) {
        return res.status(400).json({
          message: "Invalid user",
        });
      }

      return res.status(200).json({
        message: "User registered",
        user: user,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }
  },

  // check login
  isUserLoggedIn: async (req, res) => {
    try {
      const token = req.cookies.accessToken;

      if (!token) {
        return res.status(401).json({
          message: "Unauthorized access",
        });
      }

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, user) => {
        if (error) {
          return res.status(401).json({
            message: "Invalid token",
          });
        }

        return res.json({
          user: user,
        });
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },

  // logout
  logout: async (req, res) => {
    try {
      res.clearCookie("accessToken");
      return res.json({ message: "Logout successful" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },

  // ✅ GOOGLE SSO (FIXED SYNTAX + LOCALHOST COOKIE)
  googleSso: async (request, response) => {
    try {
      const { idToken } = request.body;

      if (!idToken) {
        return response.status(401).json({ message: "Invalid request" });
      }

      const googleClient = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID
      );

      const googleResponse = await googleClient.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = googleResponse.getPayload();
      const { sub: googleId, name, email } = payload;

      let user = await userDao.findByEmail(email);

      if (!user) {
        user = await userDao.create({
          name: name,
          email: email,
          googleId: googleId,
        });
      }

      const token = jwt.sign(
        {
          name: user.name,
          email: user.email,
          googleId: user.googleId,
          id: user._id,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // 🔧 ONLY LOCALHOST FIX HERE
      response.cookie("jwtToken", token, {
        httpOnly: true,
        secure: false, // localhost
        path: "/",
      });

      return response.status(200).json({
        message: "User authenticated",
        user: user,
      });
    } catch (error) {
      console.log(error);
      return response.status(500).json({
        message: "Internal server error",
      });
    }
  },
};

module.exports = authController;
