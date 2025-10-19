const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const app = express();
const port = 3001; // You can use any available port

// Middleware
app.use(cors());
app.use(express.json());

// Connect to your PostgreSQL database
const pool = new Pool({
  user: 'postgres', // Replace with your PostgreSQL username
  host: 'localhost',
  database: 'carneeds', // Your database name
  password: 'YumeBoy', // Replace with your PostgreSQL password
  port: 5432,
});

// --- API Endpoints ---


// --- SIGNUP ENDPOINT ---
app.post('/api/signup', async (req, res) => {
  // The 'name' from the form will be used as the 'username'
  const { name: username, email, phone, userType, password } = req.body;

  // Map the userType from the form to the 'role' in your database
  let role = 'buyer'; // Default role
  if (userType === 'seller' || userType === 'both') {
    role = 'seller'; // Sellers can also be buyers
  }

  try {
    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert the new user into the database using the correct column names
    const newUser = await pool.query(
      "INSERT INTO users (username, email, phone, role, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, created_at",
      [username, email, phone, role, password_hash]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    // Check for unique constraint violation (e.g., email or username already exists)
    if (err.code === '23505') {
        return res.status(409).send("User with this email or username already exists.");
    }
    res.status(500).send("Server error during signup");
  }
});

// --- NEW LOGIN ENDPOINT ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).send("Invalid credentials");
    }

    const user = userResult.rows[0];

    // Compare the submitted password with the stored hash
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return res.status(401).send("Invalid credentials");
    }

    // If login is successful, create a JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      'user_role_token', // Replace with a strong, secret key in a real app
      { expiresIn: '1h' }
    );

    // Send back the token and user role
    res.json({ token, role: user.role });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error during login");
  }
});

// ... (keep the rest of your file, including the /api/vehicles endpoint and app.listen)

// Example: Get all vehicles
app.get('/api/vehicles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicles'); // Assuming you have a 'vehicles' table
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ... (keep existing code like signup and login endpoints)

// --- NEW PROFILE ENDPOINT ---
app.get('/api/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>

    if (!token) {
      return res.status(401).send("Authorization header missing");
    }

    // Verify the token
    const decoded = jwt.verify(token, 'your_jwt_secret'); // Use the same secret key as in login

    // Fetch user data from the database using the id from the token
    const userResult = await pool.query(
      "SELECT id, username, email, phone, role, created_at FROM users WHERE id = $1", 
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).send("User not found");
    }

    const user = userResult.rows[0];
    res.json(user);

  } catch (err) {
    console.error(err.message);
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).send("Invalid token");
    }
    res.status(500).send("Server error");
  }
});


// ... (keep your app.listen at the end)

// Add more endpoints here (e.g., for login, signup, etc.)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});