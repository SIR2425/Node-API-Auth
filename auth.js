// this is the authentication / autorization middleware
// environment vars from .env file
const dotenv = require('dotenv');
dotenv.config();


const jwt = require("jsonwebtoken");

// Function to issue a token
exports.issueToken = function(user) {
  const payload = {
    _id: user._id,
    email: user.email,
    role: user.role
  };
  return jwt.sign(payload, process.env.SECRETTOKEN, { expiresIn: process.env.TOKENEXPIRY });
};

// Utility function to verify JWT using async/await
async function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.SECRETTOKEN, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

// Authorization middleware
exports.authorize = function (roles = []) {
  if (!Array.isArray(roles)) roles = [roles];

  // returns a middleware function
  return async (req, res, next) => {
    function sendError(msg) {
      return res.status(403).json({ message: msg });
    }

    try {
      const authHeader = req.headers["authorization"] || req.headers["Authorization"];
      
      // no token
      if (!authHeader) 
        return sendError("Error: No Token");

      const token = authHeader.split(" ")[1];

      // invalid token format
      if (!token) 
        return sendError("Error: Token format invalid");

      const decodedToken = await verifyToken(token);

      // invalid token, send error message and stop execution
      if (!decodedToken.role) 
        return sendError("Error: Role missing");

      // check if user has the required role(s)
      if (roles.length && !roles.includes(decodedToken.role)) {
        return sendError("Error: User not authorized");
      }

      // all checks passed, user is authorized
      // add user info to request object for later use
      req.user = decodedToken;

      // continue to next middleware or route handler
      next();
    } catch (err) {
      // error
      console.log(">>>>", err);
      return sendError("Error: Broken Or Expired Token");
    }
  };
};

exports.Roles = {
  User: ["user"],
  Admin: ["admin"],
  All: ["user", "admin"],
};
