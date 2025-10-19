// db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'carneeds',
  password: 'YOUR_PASSWORD_HERE',
  port: 5432, // default PostgreSQL port
});

module.exports = pool;
