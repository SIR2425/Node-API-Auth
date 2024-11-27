// environment vars from .env file
const dotenv = require('dotenv');
dotenv.config();

// database utility methods
const { connectToDatabase } = require('./db');

// express framework
const express = require("express");
const app = express();

// express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// mount routes defined in route.js
app.use("/", require("./route"));

const _port = 3000;

async function startServer() {
  try {
    // Connect to the database
    await connectToDatabase();

    await app.listen(process.env.PORT | 3000)
    console.log(`Server running on port ${process.env.PORT}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

startServer();

