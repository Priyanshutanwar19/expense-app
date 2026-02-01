const jwt = require("jsonwebtoken");

const authMiddleware = {
    protect: async (request, response, next) => {
        try {

            const header = request.headers.authorization;
            if(!header || !header.startsWith("Bearer ")){
                return response.status(401).json({
                    success: false,
                    message: "Not authorized, token missing"
                });
            }

            const token = header.split(" ")[1];
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            request.userId = decoded.id;
            next();

        } catch (error) {
            return response.status(401).json({
                success: false,
                message: "Not authorized, invalid token"
            });
        }
    }
};

module.exports = authMiddleware;
