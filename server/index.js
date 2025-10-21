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

// Get posted vehicles (Seller Dashboard)
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

// Get ALL public vehicles (Homepage)
app.get('/api/vehicles', async (req, res) => {
    try {
        const vehiclesResult = await pool.query(
            `SELECT 
                v.id, v.title, v.price, v.location, v.mileage, v.fuel_type AS fuel, v.is_rentable, v.description, v.make, v.model, v.year,
                u.username AS seller_name, u.phone AS seller_phone, u.email AS seller_email,
                (SELECT vi.image_url FROM vehicle_images vi WHERE vi.vehicle_id = v.id LIMIT 1) AS image
             FROM vehicles v
             JOIN users u ON v.user_id = u.id
             ORDER BY v.created_at DESC`
        );

        const vehicles = vehiclesResult.rows.map(row => ({
            id: row.id,
            title: row.title,
            price: row.price ? Number(row.price).toLocaleString() : 'N/A', // FIX: Safe price conversion
            location: row.location,
            mileage: row.mileage ? `${row.mileage.toLocaleString()} km` : 'N/A', // FIX: Safe mileage conversion
            fuel: row.fuel,
            image: row.image ? `http://localhost:${port}${row.image}` : '/placeholder.svg',
            make: row.make,
            seller_name: row.seller_name,
            seller_phone: row.seller_phone,
            seller_email: row.seller_email,
            is_rentable: row.is_rentable,
            rating: 4.5 
        }));

        res.json(vehicles);

    } catch (err) {
        console.error("Error fetching all vehicles:", err.message);
        // This is a common point of failure. Increased error visibility.
        res.status(500).send("Server error when fetching vehicles: " + err.message);
    }
});


// Get single vehicle (Details Page - NOW PUBLIC)
app.get('/api/vehicles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // FIX: Removed token check for public access (This endpoint is correctly public)
        
        // 1. Fetch main vehicle and seller details
        const vehicleResult = await pool.query(
            `SELECT 
                v.*, 
                u.username AS seller_name, 
                u.phone AS seller_phone, 
                u.email AS seller_email,
                u.role AS seller_role,
                u.id AS seller_id -- FIX: Ensure seller ID is available for ChatModal initialization
             FROM vehicles v
             JOIN users u ON v.user_id = u.id
             WHERE v.id = $1`,
            [id]
        );

        if (vehicleResult.rows.length === 0) {
            return res.status(404).send("Vehicle not found.");
        }

        const vehicle = vehicleResult.rows[0];

        // 2. Fetch all associated images
        const imagesResult = await pool.query(
            `SELECT id, image_url FROM vehicle_images WHERE vehicle_id = $1 ORDER BY id ASC`,
            [id]
        );

        // 3. Assemble final data object
        const vehicleData = {
            id: vehicle.id,
            title: vehicle.title,
            description: vehicle.description,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            condition: vehicle.condition,
            price: Number(vehicle.price).toLocaleString(),
            mileage: vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A',
            fuel_type: vehicle.fuel_type,
            transmission: vehicle.transmission,
            location: vehicle.location,
            is_rentable: vehicle.is_rentable,
            created_at: vehicle.created_at,
            
            // Seller Details
            seller: {
                id: vehicle.seller_id, // FIX: Added seller ID
                name: vehicle.seller_name,
                phone: vehicle.seller_phone,
                email: vehicle.seller_email,
                role: vehicle.seller_role,
            },
            
            // Image URLs (relative path)
            images: imagesResult.rows.map(row => row.image_url),
            
            rating: 4.5,
            views: 120,
        };
        
        res.json(vehicleData);

    } catch (err) {
        console.error("Error fetching vehicle details:", err.message);
        res.status(500).send("Server error when fetching vehicle details: " + err.message);
    }
});


// Update a vehicle (Edit/Update)
app.put('/api/vehicles/:id', async (req, res) => {
    const client = await pool.connect(); 
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).send("Authorization header missing");
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        const { title, description, make, model, year, condition, price, mileage, fuel_type, transmission, location, images } = req.body;

        const parsedYear = parseInt(year, 10) || null;
        const parsedPrice = parseFloat(price) || null;
        const parsedMileage = parseInt(mileage, 10) || null;

        await client.query('BEGIN'); 

        const result = await pool.query(
            `UPDATE vehicles 
             SET title = $1, description = $2, make = $3, model = $4, year = $5, condition = $6, price = $7, mileage = $8, fuel_type = $9, transmission = $10, location = $11
             WHERE id = $12 AND user_id = $13 RETURNING *`,
            [title, description, make, model, parsedYear, condition, parsedPrice, parsedMileage, fuel_type, transmission, location, id, userId]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).send("Vehicle not found or you don't have permission to update it.");
        }
        
        if (images !== undefined) { 
            const placeholders = images.map((_, i) => `$${i + 2}`).join(',');
            await client.query(
                `DELETE FROM vehicle_images WHERE vehicle_id = $1 AND image_url NOT IN (${placeholders || 'NULL'})`,
                [id, ...images]
            );
        }

        if (images && images.length > 0) {
            for (const imageUrl of images) {
                const exists = await client.query(
                    'SELECT 1 FROM vehicle_images WHERE vehicle_id = $1 AND image_url = $2',
                    [id, imageUrl]
                );
                if (exists.rows.length === 0) {
                    await client.query(
                        'INSERT INTO vehicle_images (vehicle_id, image_url) VALUES ($1, $2)',
                        [id, imageUrl]
                    );
                }
            }
        } else if (images !== undefined && images.length === 0) {
             await client.query('DELETE FROM vehicle_images WHERE vehicle_id = $1', [id]);
        }

        await client.query('COMMIT'); 
        
        res.json({ message: "Vehicle updated successfully", vehicle: result.rows[0] });

    } catch (err) {
        await client.query('ROLLBACK'); 
        console.error("Error updating vehicle:", err.message);
        if (err.name === 'JsonWebTokenError') return res.status(403).send("Invalid token");
        res.status(500).send("Server error");
    } finally {
        client.release(); 
    }
});


// Delete a vehicle
app.delete('/api/vehicles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).send("Authorization header missing");
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        const result = await pool.query(
            "DELETE FROM vehicles WHERE id = $1 AND user_id = $2",
            [id, userId]
        );
        
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