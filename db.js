const { MongoClient } = require('mongodb');

let db;

async function connectToDatabase() {
  if (db) {
    return db;
  }
  
  const client = new MongoClient(process.env.DBURI);
  await client.connect();
  db = client.db(process.env.DB_NAME);
  console.log('Connected to database');
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
}

module.exports = { connectToDatabase, getDatabase };