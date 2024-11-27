// environment vars from .env file
const dotenv = require('dotenv');
dotenv.config();

// hashing
const bcrypt = require("bcryptjs");

// id mapping for mongodb
const { ObjectId } = require("mongodb");
const { connectToDatabase } = require('./db');

// authorization middleware
const { issueToken, authorize, Roles } = require("./auth");

// express router middleware
const { Router } = require("express");
const router = new Router();

/* Add a New User : registration + issue token */
router.post("/user", async (req, res) => {
  try {
    // info to create user, extracted from body
    const { email, password, role, name } = req.body;

    const db = await connectToDatabase();

    // password hashed to be stored in database
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserData = { name, email, password: hashedPassword, role, isActive: true };
    
    // store the new user data
    const storedUser = await db.collection("users").insertOne(newUserData);
    const newUser = { _id: storedUser.insertedId, email, name, role };
    
    // send the newly created user and the token to the client
    const token = issueToken(newUser);
    res.status(200).json({ ...newUser, token });
  } catch (err) {
    // error
    console.log(err);
    res.status(400).json({ message: "Error: Could not add user" });
  }
});

/* Login with Credentials */
/* open route */
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const query = { email };

    const db = await connectToDatabase();
    const storedUser = await db.collection("users").findOne(query);
    
    // User not found
    if (!storedUser) {
      return res.status(401).json({ message: "Incorrect Credentials" });
    }

    // User found
    const hashedPassword = storedUser.password;
    const isPasswordCorrect = await bcrypt.compare(password, hashedPassword);

    // Wrong password
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Incorrect Credentials" });
    }

    // Successful authentication
    const AthenticatedUser = storedUser;
    delete AthenticatedUser.password;

    // Issue token to authenticated user
    const token = issueToken(AthenticatedUser);
    return res.status(200).json({ ...AthenticatedUser, token });
  } catch (err) {
    // Authentication error
    console.log(err);
    return res.status(400).json({ message: "Error: Could not get user details" });
  }
});

/* Get User Profile */
/* need authentication, all roles allowed*/
router.get("/user/profile", authorize(Roles.All), async (req, res) => {
 try {
    // get the token
    const token = req.headers["authorization"] || req.headers["Authorization"];

    // no token provided
    if (!token) {
      return res.status(403).json({ message: "Authentication invalid" });
    }

    console.log("req.user",req.user);

    // the authorize middleware sets the request.user with the decoded token info
    const userId = req.user._id;
    const query = { _id: new ObjectId(userId) }

    const db = await connectToDatabase();
    const storedUser = await db.collection("users").findOne(query);

    // User not found
    if (!storedUser) {
      return res.status(404).json({ message: "User profile not found" });
    }

    // User found, remove password before returning
    delete storedUser.password;
    return res.status(200).json(storedUser);
  } catch (err) {
    // error
    console.log(err);
    return res.status(400).json({ message: "Error: Could not get user profile" });
  }
});

/* Update isActive field */

router.patch("/user/status", authorize(Roles.Admin), async (req, res) => {
  try {
    const { email, isActive } = req.body;
    const query = { email: email }; // Use email for the query
    const update = { $set: { isActive: isActive } };
    
    const db = await connectToDatabase();
    const result = await db.collection("users").updateOne(query, update);

    // User not found
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // TODO ::: If the user is set to inactive => revoke the token
    // while not implemented, the token will be valid until expired
 
    // User found, updated status
    return res.status(200).json({ message: "User status updated successfully" });
  } catch (err) {
    // error
    console.log(err);
    return res.status(400).json({ message: "Error: Could not update user status" });
  }
});

module.exports = router;
