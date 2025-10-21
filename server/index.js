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

// Helper function to verify JWT and get user ID
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).send("Authorization header missing");
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user payload to the request
        next();
    } catch (err) {
        return res.status(403).send("Invalid token");
    }
};

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

// Profile get data
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const userResult = await pool.query(
        "SELECT id, username, email, phone, role, created_at FROM users WHERE id = $1", 
        [userId]
      );
      if (userResult.rows.length === 0) return res.status(404).send("User not found");
      res.json(userResult.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
});

// Profile update data
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, phone } = req.body;
    const updatedUser = await pool.query(
      "UPDATE users SET username = $1, email = $2, phone = $3 WHERE id = $4 RETURNING id, username, email, phone, role",
      [username, email, phone, userId]
    );
    if (updatedUser.rows.length === 0) return res.status(404).send("User not found");
    res.json(updatedUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') return res.status(409).send("Email or username already in use.");
    res.status(500).send("Server error");
  }
});

// Post vehicles
app.post('/api/vehicles', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
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
        res.status(500).send("Server error");
    }
});

// Get posted vehicles (Seller Dashboard)
app.get('/api/my-vehicles', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
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
        res.status(500).send("Server error");
    }
});

// Get ALL public vehicles (Homepage)
app.get('/api/vehicles', async (req, res) => {
    try {
        const vehiclesResult = await pool.query(
            `SELECT 
                v.id, v.title, v.price, v.location, v.mileage, v.fuel_type AS fuel, v.is_rentable, v.description, v.make,
                u.username AS seller_name, u.phone AS seller_phone, u.email AS seller_email, u.id AS seller_id,
                (SELECT vi.image_url FROM vehicle_images vi WHERE vi.vehicle_id = v.id LIMIT 1) AS image
             FROM vehicles v
             JOIN users u ON v.user_id = u.id
             ORDER BY v.created_at DESC`
        );

        const vehicles = vehiclesResult.rows.map(row => ({
            id: row.id,
            title: row.title,
            price: row.price ? Number(row.price).toLocaleString() : 'N/A',
            location: row.location,
            mileage: row.mileage ? `${row.mileage.toLocaleString()} km` : 'N/A',
            fuel: row.fuel,
            image: row.image ? `http://localhost:${port}${row.image}` : '/placeholder.svg',
            make: row.make,
            seller_id: row.seller_id,
            seller_name: row.seller_name,
            seller_phone: row.seller_phone,
            seller_email: row.seller_email,
            is_rentable: row.is_rentable,
            rating: 4.5 
        }));
        res.json(vehicles);
    } catch (err) {
        console.error("Error fetching all vehicles:", err.message);
        res.status(500).send("Server error when fetching vehicles: " + err.message);
    }
});

// Get single vehicle for (Edit Page - Authenticated)
app.get('/api/edit-vehicle/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

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
        res.status(500).send("Server error");
    }
});

// Get single vehicle (Details Page - Public)
app.get('/api/vehicles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const vehicleResult = await pool.query(
            `SELECT 
                v.*, 
                u.id AS seller_id, 
                u.username AS seller_name, 
                u.phone AS seller_phone, 
                u.email AS seller_email,
                u.role AS seller_role
             FROM vehicles v
             JOIN users u ON v.user_id = u.id
             WHERE v.id = $1`,
            [id]
        );

        if (vehicleResult.rows.length === 0) {
            return res.status(404).send("Vehicle not found.");
        }
        const vehicle = vehicleResult.rows[0];

        const imagesResult = await pool.query(
            `SELECT id, image_url FROM vehicle_images WHERE vehicle_id = $1 ORDER BY id ASC`,
            [id]
        );

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
            seller: {
                id: vehicle.seller_id,
                name: vehicle.seller_name,
                phone: vehicle.seller_phone,
                email: vehicle.seller_email,
                role: vehicle.seller_role,
            },
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

// Update a vehicle
app.put('/api/vehicles/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect(); 
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { title, description, make, model, year, condition, price, mileage, fuel_type, transmission, location, images } = req.body;
        const parsedYear = parseInt(year, 10) || null;
        const parsedPrice = parseFloat(price) || null;
        const parsedMileage = parseInt(mileage, 10) || null;
        await client.query('BEGIN'); 
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
        if (images !== undefined) { 
            const placeholders = images.map((_, i) => `$${i + 2}`).join(',');
            await client.query(
                `DELETE FROM vehicle_images WHERE vehicle_id = $1 AND image_url NOT IN (${placeholders || 'NULL'})`,
                [id, ...images]
            );
        }
        if (images && images.length > 0) {
            for (const imageUrl of images) {
                const exists = await client.query('SELECT 1 FROM vehicle_images WHERE vehicle_id = $1 AND image_url = $2', [id, imageUrl]);
                if (exists.rows.length === 0) {
                    await client.query('INSERT INTO vehicle_images (vehicle_id, image_url) VALUES ($1, $2)', [id, imageUrl]);
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
        res.status(500).send("Server error");
    } finally {
        client.release(); 
    }
});

// Delete a vehicle
app.delete('/api/vehicles/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const result = await pool.query("DELETE FROM vehicles WHERE id = $1 AND user_id = $2", [id, userId]);
        if (result.rowCount === 0) {
            return res.status(404).send("Vehicle not found or you don't have permission to delete it.");
        }
        res.status(200).json({ message: "Vehicle deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// --- CHAT ENDPOINTS ---

// GET: Fetch all active conversations (UPDATED FOR UNREAD COUNT)
app.get('/api/chats', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const chatsResult = await pool.query(
            `SELECT 
                c.id, c.vehicle_id, c.created_at,
                v.title AS vehicle_title,
                CASE WHEN c.buyer_id = $1 THEN s.username ELSE b.username END AS other_user_name,
                CASE WHEN c.buyer_id = $1 THEN s.id ELSE b.id END AS other_user_id,
                (SELECT message FROM messages WHERE chat_id = c.id ORDER BY sent_at DESC LIMIT 1) AS last_message,
                
                -- Count unread messages that were NOT sent by the current user
                (SELECT COUNT(*) FROM messages m 
                 WHERE m.chat_id = c.id 
                 AND m.is_read = FALSE 
                 AND m.sender_id != $1) AS unread_count

             FROM chats c
             JOIN users b ON c.buyer_id = b.id
             JOIN users s ON c.seller_id = s.id
             JOIN vehicles v ON c.vehicle_id = v.id
             WHERE c.buyer_id = $1 OR c.seller_id = $1
             ORDER BY c.created_at DESC`,
            [userId]
        );
        res.json(chatsResult.rows);
    } catch (err) {
        console.error("Error fetching chats:", err.message);
        res.status(500).send("Server error fetching chats");
    }
});

// POST: Send a message, or start a new chat
app.post('/api/chats/message', authenticateToken, async (req, res) => {
    const senderId = req.user.id;
    const { message, receiverId, vehicleId, chatId } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let currentChatId = chatId;

        if (!currentChatId) {
            const vehicleResult = await client.query('SELECT user_id FROM vehicles WHERE id = $1', [vehicleId]);
            if (vehicleResult.rows.length === 0) throw new Error("Vehicle not found.");
            
            const sellerId = vehicleResult.rows[0].user_id;
            
            if (senderId === sellerId) {
                throw new Error("Sellers cannot message themselves on their own listings.");
            }
            
            const buyerId = senderId;

            const existingChat = await client.query(
                'SELECT id FROM chats WHERE vehicle_id = $1 AND buyer_id = $2 AND seller_id = $3',
                [vehicleId, buyerId, sellerId]
            );

            if (existingChat.rows.length > 0) {
                currentChatId = existingChat.rows[0].id;
            } else {
                const newChat = await client.query(
                    'INSERT INTO chats (buyer_id, seller_id, vehicle_id) VALUES ($1, $2, $3) RETURNING id',
                    [buyerId, sellerId, vehicleId]
                );
                currentChatId = newChat.rows[0].id;
            }
        }

        const messageResult = await client.query(
            'INSERT INTO messages (chat_id, sender_id, message) VALUES ($1, $2, $3) RETURNING *',
            [currentChatId, senderId, message]
        );

        await client.query('COMMIT');
        res.status(201).json({ chatId: currentChatId, message: messageResult.rows[0] });

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error sending message:", e.message);
        res.status(500).send("Server error sending message: " + e.message);
    } finally {
        client.release();
    }
});

// GET: Fetch all messages for a specific chat
app.get('/api/chats/:chatId/messages', authenticateToken, async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.id;
    try {
        const chatCheck = await pool.query('SELECT * FROM chats WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)', [chatId, userId]);
        if (chatCheck.rows.length === 0) return res.status(403).send("Access denied.");

        const messagesResult = await pool.query(
            'SELECT id, message, sender_id, sent_at FROM messages WHERE chat_id = $1 ORDER BY sent_at ASC',
            [chatId]
        );
        
        const messages = messagesResult.rows.map(msg => ({
            id: msg.id,
            text: msg.message,
            sender: msg.sender_id === userId ? 'user' : 'other',
            timestamp: new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        res.json({ messages, vehicleId: chatCheck.rows[0].vehicle_id });
    } catch (err) {
        console.error("Error fetching messages:", err.message);
        res.status(500).send("Server error fetching messages");
    }
});

// --- NEW ENDPOINT TO MARK MESSAGES AS READ ---
app.put('/api/chats/:chatId/read', authenticateToken, async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.id; // The user who is *reading* the messages

    try {
        // Mark all messages in this chat as read,
        // EXCEPT for the ones sent by the current user
        await pool.query(
            `UPDATE messages 
             SET is_read = TRUE 
             WHERE chat_id = $1 
             AND sender_id != $2 
             AND is_read = FALSE`,
            [chatId, userId]
        );
        res.status(200).json({ message: "Messages marked as read" });
    } catch (err) {
        console.error("Error marking messages as read:", err.message);
        res.status(500).send("Server error");
    }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});