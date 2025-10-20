const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

// --- IMPORTANT: Define your JWT secret key in one place ---
const JWT_SECRET = 'your_super_secret_and_long_jwt_key'; 

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// --- MULTER SETUP FOR FILE UPLOADS ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'server/public/uploads/';
    // Create the directory if it doesn't exist to prevent errors
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Connect to your PostgreSQL database
const pool = new Pool({
  user: 'postgres', // Replace with your PostgreSQL username
  host: 'localhost',
  database: 'carneeds', // Make sure this matches your DB name
  password: 'YumeBoy', // Replace with your PostgreSQL password
  port: 5432,
});

// NEW: Endpoint to handle image uploads
app.post('/api/upload', upload.array('images', 8), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ urls: fileUrls });
});

// --- SIGNUP ENDPOINT ---
app.post('/api/signup', async (req, res) => {
    const { name: username, email, phone, userType, password } = req.body;
    let role = 'buyer';
    if (userType === 'seller' || userType === 'both') {
      role = 'seller';
    }
  
    try {
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);
      const newUser = await pool.query(
        "INSERT INTO users (username, email, phone, role, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, created_at",
        [username, email, phone, role, password_hash]
      );
      res.status(201).json(newUser.rows[0]);
    } catch (err) {
      console.error(err.message);
      if (err.code === '23505') {
          return res.status(409).send("User with this email or username already exists.");
      }
      res.status(500).send("Server error during signup");
    }
});

// --- LOGIN ENDPOINT ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (userResult.rows.length === 0) return res.status(401).send("Invalid credentials");
  
      const user = userResult.rows[0];
      const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordCorrect) return res.status(401).send("Invalid credentials");
  
      // Use the consistent JWT_SECRET
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
  
      res.json({ token, role: user.role });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error during login");
    }
});

// --- PROFILE ENDPOINT ---
app.get('/api/profile', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).send("Authorization header missing");
  
      // Use the consistent JWT_SECRET
      const decoded = jwt.verify(token, JWT_SECRET);
  
      const userResult = await pool.query(
        "SELECT id, username, email, phone, role, created_at FROM users WHERE id = $1", 
        [decoded.id]
      );
  
      if (userResult.rows.length === 0) return res.status(404).send("User not found");
  
      res.json(userResult.rows[0]);
    } catch (err) {
      console.error(err.message);
      if (err.name === 'JsonWebTokenError') return res.status(403).send("Invalid token");
      res.status(500).send("Server error");
    }
});

// --- NEW UPDATE PROFILE ENDPOINT ---
app.put('/api/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).send("Authorization header missing");
    }

    // Verify the token and get the user's ID
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    // Get the updated data from the request body
    const { username, email, phone } = req.body;

    // Update the user in the database
    const updatedUser = await pool.query(
      "UPDATE users SET username = $1, email = $2, phone = $3 WHERE id = $4 RETURNING id, username, email, phone, role",
      [username, email, phone, userId]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).send("User not found");
    }

    // Send back the updated user data
    res.json(updatedUser.rows[0]);

  } catch (err) {
    console.error(err.message);
    if (err.name === 'JsonWebTokenError') return res.status(403).send("Invalid token");
    // Handle cases where the new email or username is already taken
    if (err.code === '23505') return res.status(409).send("Email or username already in use.");
    res.status(500).send("Server error");
  }
});

// Post a New Vehicle
app.post('/api/vehicles', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).send("Authorization header missing");

        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const { title, description, make, model, year, condition, price, mileage, fuel_type, transmission, location, is_rentable, images } = req.body;

        const parsedYear = parseInt(year, 10) || null;
        const parsedPrice = parseFloat(price) || null;
        const parsedMileage = parseInt(mileage, 10) || null;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const vehicleResult = await client.query(
                `INSERT INTO vehicles (user_id, title, description, make, model, year, condition, price, mileage, fuel_type, transmission, location, is_rentable) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
                [userId, title, description, make, model, parsedYear, condition, parsedPrice, parsedMileage, fuel_type, transmission, location, is_rentable]
            );
            const vehicleId = vehicleResult.rows[0].id;

            if (images && images.length > 0) {
                for (const imageUrl of images) {
                    await client.query('INSERT INTO vehicle_images (vehicle_id, image_url) VALUES ($1, $2)', [vehicleId, imageUrl]);
                }
            }
            await client.query('COMMIT');
            res.status(201).json({ message: "Vehicle posted successfully", vehicleId });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err.message);
        if (err.name === 'JsonWebTokenError') return res.status(403).send("Invalid token");
        res.status(500).send("Server error");
    }
});

// --- NEW ENDPOINT TO GET A USER'S OWN VEHICLES ---
app.get('/api/my-vehicles', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).send("Authorization header missing");
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        const vehiclesResult = await pool.query(
            `SELECT v.*, (SELECT vi.image_url FROM vehicle_images vi WHERE vi.vehicle_id = v.id LIMIT 1) as image
             FROM vehicles v
             WHERE v.user_id = $1
             ORDER BY v.created_at DESC`,
            [userId]
        );

        res.json(vehiclesResult.rows);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'JsonWebTokenError') return res.status(403).send("Invalid token");
        res.status(500).send("Server error");
    }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});