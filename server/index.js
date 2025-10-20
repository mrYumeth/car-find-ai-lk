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

const JWT_SECRET = 'your_super_secret_and_long_jwt_key';

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- MULTER SETUP FOR FILE UPLOADS ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Corrected and simplified path
    const dir = path.join(__dirname, 'public/uploads');
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

// --- DATABASE CONNECTION ---
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'carneeds',
  password: 'YumeBoy',
  port: 5432,
});

// --- API ENDPOINTS ---

// Upload Image
app.post('/api/upload', upload.array('images', 8), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ urls: fileUrls });
});


// Sign up
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

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (userResult.rows.length === 0) return res.status(401).send("Invalid credentials");
      const user = userResult.rows[0];
      const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordCorrect) return res.status(401).send("Invalid credentials");
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

// Profile save data
app.get('/api/profile', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).send("Authorization header missing");
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

// Profile get data
app.put('/api/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).send("Authorization header missing");
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    const { username, email, phone } = req.body;
    const updatedUser = await pool.query(
      "UPDATE users SET username = $1, email = $2, phone = $3 WHERE id = $4 RETURNING id, username, email, phone, role",
      [username, email, phone, userId]
    );
    if (updatedUser.rows.length === 0) return res.status(404).send("User not found");
    res.json(updatedUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    if (err.name === 'JsonWebTokenError') return res.status(403).send("Invalid token");
    if (err.code === '23505') return res.status(409).send("Email or username already in use.");
    res.status(500).send("Server error");
  }
});

// Post vehicles
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

// Get posted vehicles
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

// --- NEW ENDPOINT TO GET A SINGLE VEHICLE FOR EDITING ---
app.get('/api/vehicles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).send("Authorization header missing");
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        // Fetch vehicle and its images, ensuring the user owns it
        const vehicleResult = await pool.query(
            `SELECT * FROM vehicles WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        if (vehicleResult.rows.length === 0) {
            return res.status(404).send("Vehicle not found or you don't have permission to edit it.");
        }

        const imagesResult = await pool.query(
            `SELECT id, image_url FROM vehicle_images WHERE vehicle_id = $1`,
            [id]
        );

        const vehicleData = {
            ...vehicleResult.rows[0],
            images: imagesResult.rows,
        };
        
        res.json(vehicleData);

    } catch (err) {
        console.error(err.message);
        if (err.name === 'JsonWebTokenError') return res.status(403).send("Invalid token");
        res.status(500).send("Server error");
    }
});

// --- UPDATED ENDPOINT TO UPDATE A VEHICLE (Handles Images) ---
app.put('/api/vehicles/:id', async (req, res) => {
    const client = await pool.connect(); // Use a client for transaction
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).send("Authorization header missing");
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        // Get all fields including the final list of image URLs
        const { title, description, make, model, year, condition, price, mileage, fuel_type, transmission, location, images } = req.body;

        const parsedYear = parseInt(year, 10) || null;
        const parsedPrice = parseFloat(price) || null;
        const parsedMileage = parseInt(mileage, 10) || null;

        await client.query('BEGIN'); // Start transaction

        // 1. Update the main vehicle details
        const result = await client.query(
            `UPDATE vehicles 
             SET title = $1, description = $2, make = $3, model = $4, year = $5, condition = $6, price = $7, mileage = $8, fuel_type = $9, transmission = $10, location = $11
             WHERE id = $12 AND user_id = $13 RETURNING *`,
            [title, description, make, model, parsedYear, condition, parsedPrice, parsedMileage, fuel_type, transmission, location, id, userId]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).send("Vehicle not found or you don't have permission to update it.");
        }
        
        // 2. Delete existing images that are NOT in the submitted 'images' array
        //    (We only delete if the 'images' array is provided in the request)
        if (images !== undefined) { // Check if images array was sent
            // Construct the placeholders for the WHERE NOT IN clause
            const placeholders = images.map((_, i) => `$${i + 2}`).join(',');
            await client.query(
                `DELETE FROM vehicle_images WHERE vehicle_id = $1 AND image_url NOT IN (${placeholders || 'NULL'})`,
                [id, ...images]
            );
        }

        // 3. Add new images (check if they already exist to avoid duplicates)
        if (images && images.length > 0) {
            for (const imageUrl of images) {
                // Check if this image URL already exists for this vehicle
                const exists = await client.query(
                    'SELECT 1 FROM vehicle_images WHERE vehicle_id = $1 AND image_url = $2',
                    [id, imageUrl]
                );
                // If it doesn't exist, insert it
                if (exists.rows.length === 0) {
                    await client.query(
                        'INSERT INTO vehicle_images (vehicle_id, image_url) VALUES ($1, $2)',
                        [id, imageUrl]
                    );
                }
            }
        } else if (images !== undefined && images.length === 0) {
             // If an empty images array is sent, delete all existing images
             await client.query('DELETE FROM vehicle_images WHERE vehicle_id = $1', [id]);
        }
        // If images array is undefined, don't touch existing images

        await client.query('COMMIT'); // Commit transaction
        
        res.json({ message: "Vehicle updated successfully", vehicle: result.rows[0] });

    } catch (err) {
        await client.query('ROLLBACK'); // Rollback on any error
        console.error("Error updating vehicle:", err.message);
        if (err.name === 'JsonWebTokenError') return res.status(403).send("Invalid token");
        res.status(500).send("Server error");
    } finally {
        client.release(); // Release client connection
    }
});


// --- NEW ENDPOINT TO DELETE A VEHICLE ---
app.delete('/api/vehicles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).send("Authorization header missing");
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        // The ON DELETE CASCADE in your database schema will handle deleting associated images.
        const result = await pool.query(
            "DELETE FROM vehicles WHERE id = $1 AND user_id = $2",
            [id, userId]
        );
        
        // rowCount will be 0 if no row was found (or user didn't have permission)
        if (result.rowCount === 0) {
            return res.status(404).send("Vehicle not found or you don't have permission to delete it.");
        }

        res.status(200).json({ message: "Vehicle deleted successfully" });

    } catch (err) {
        console.error(err.message);
        if (err.name === 'JsonWebTokenError') return res.status(403).send("Invalid token");
        res.status(500).send("Server error");
    }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});