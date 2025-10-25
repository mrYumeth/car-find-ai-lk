// server/index.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch'); // NLP Service
const authenticateToken = require('./authMiddleware'); // KEEP THIS LINE
const isAdmin = require('./adminMiddleware'); // ++ Import isAdmin middleware

const app = express();
const port = 3001;

const JWT_SECRET = 'your_super_secret_and_long_jwt_key';

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')))

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

        // ++ FIX: Removed the invalid '//' comment from the SQL query ++
        const vehicleResult = await pool.query(
            `SELECT
                v.*,
                u.id AS seller_id,
                u.username AS seller_name,
                u.phone AS seller_phone,
                u.email AS seller_email
                -- If you add seller_role later, add it here without '//'
            FROM vehicles v
            JOIN users u ON v.user_id = u.id
            WHERE v.id = $1`,
            [id]
        );
        // ++ END FIX ++

        if (vehicleResult.rows.length === 0) {
            console.log(`[API /vehicles/:id] Vehicle with ID ${id} not found.`);
            return res.status(404).send("Vehicle not found.");
        }
        const vehicle = vehicleResult.rows[0];

        const imagesResult = await pool.query(
            `SELECT id, image_url FROM vehicle_images WHERE vehicle_id = $1 ORDER BY id ASC`,
            [id]
        );

        const imagesWithFullUrl = imagesResult.rows.map(row => ({
            id: row.id,
            image_url: `http://localhost:${port}${row.image_url}`
        }));

        // Construct the response object (This part was correct in the last version)
        const vehicleData = {
            id: vehicle.id,
            title: vehicle.title,
            description: vehicle.description,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            condition: vehicle.condition,
            price: vehicle.price,
            mileage: vehicle.mileage,
            fuel_type: vehicle.fuel_type,
            transmission: vehicle.transmission,
            location: vehicle.location,
            is_rentable: vehicle.is_rentable,
            created_at: vehicle.created_at,
            seller_id: vehicle.seller_id,
            seller_name: vehicle.seller_name,
            seller_phone: vehicle.seller_phone,
            seller_email: vehicle.seller_email,
            images: imagesWithFullUrl,
        };

        res.json(vehicleData);

    } catch (err) {
        console.error(`[API /vehicles/:id] Error fetching details for ID ${req.params.id}:`, err.message);
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

// --- NEW ENDPOINT TO FIND A CHAT ---
app.get('/api/chats/find', authenticateToken, async (req, res) => {
    const userId = req.user.id; // This is the buyer
    const { vehicleId, sellerId } = req.query;

    if (!vehicleId || !sellerId) {
        return res.status(400).send("Missing vehicleId or sellerId");
    }

    try {
        const existingChat = await pool.query(
            'SELECT id FROM chats WHERE vehicle_id = $1 AND buyer_id = $2 AND seller_id = $3',
            [vehicleId, userId, sellerId]
        );

        if (existingChat.rows.length > 0) {
            res.json({ chatId: existingChat.rows[0].id });
        } else {
            // No chat found, which is fine. The first message will create it.
            res.status(404).send("No existing chat found.");
        }
    } catch (err) {
        console.error("Error finding chat:", err.message);
        res.status(500).send("Server error");
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

// ++ NEW: NLP Search Endpoint
app.get('/api/search/nlp', async (req, res) => {
    const queryText = req.query.q; // Get the natural language query (e.g., "q=Toyota CHR under 5 million")

    if (!queryText) {
        return res.status(400).send("Search query is missing.");
    }

    try {
        // --- Step 1: Call NLP Service ---
        // Assuming your Python NLP service runs on localhost:5000/parse
        const nlpResponse = await fetch(`http://localhost:5000/parse?query=${encodeURIComponent(queryText)}`);
        if (!nlpResponse.ok) {
            console.error("NLP service failed with status:", nlpResponse.status);
             // Fallback to basic keyword search in case NLP service fails
            return await fallbackKeywordSearch(queryText, res);
        }
        const extractedEntities = await nlpResponse.json();
        console.log("Extracted Entities:", extractedEntities); // Log for debugging

        // Check if NLP returned any useful entities
        if (Object.values(extractedEntities).every(v => v === null)) {
             console.log("NLP returned no useful entities, falling back to keyword search.");
             return await fallbackKeywordSearch(queryText, res);
        }

        // --- Step 2: Build Database Query ---
        let dbQuery = `
            SELECT
                v.id, v.title, v.price, v.location, v.mileage, v.fuel_type AS fuel, v.is_rentable, v.make, v.model, v.year,
                u.username AS seller_name, u.phone AS seller_phone, u.email AS seller_email, u.id AS seller_id,
                (SELECT vi.image_url FROM vehicle_images vi WHERE vi.vehicle_id = v.id LIMIT 1) AS image
            FROM vehicles v
            JOIN users u ON v.user_id = u.id
            WHERE 1=1 `; // Start with a condition that's always true

        const queryParams = [];
        let paramIndex = 1;

        // Add conditions based on extracted entities
        if (extractedEntities.make) {
            dbQuery += ` AND LOWER(v.make) LIKE LOWER($${paramIndex++}) `;
            queryParams.push(`%${extractedEntities.make}%`);
        }
        if (extractedEntities.model) {
             // More robust model matching might involve checking title too
            dbQuery += ` AND (LOWER(v.model) LIKE LOWER($${paramIndex++}) OR LOWER(v.title) LIKE LOWER($${paramIndex++})) `;
            queryParams.push(`%${extractedEntities.model}%`, `%${extractedEntities.model}%`); // Add param twice
          //paramIndex++; // Increment again because we added two placeholders
        }
         if (extractedEntities.location) {
             // Using ILIKE for case-insensitive matching in PostgreSQL
            dbQuery += ` AND v.location ILIKE $${paramIndex++} `;
            queryParams.push(`%${extractedEntities.location}%`);
        }
         if (extractedEntities.min_price) {
            dbQuery += ` AND v.price >= $${paramIndex++} `;
            queryParams.push(extractedEntities.min_price);
        }
        if (extractedEntities.max_price) {
            dbQuery += ` AND v.price <= $${paramIndex++} `;
            queryParams.push(extractedEntities.max_price);
        }
        if (extractedEntities.year) {
             dbQuery += ` AND v.year = $${paramIndex++} `;
            queryParams.push(extractedEntities.year);
        }
        if (extractedEntities.fuel_type) {
             dbQuery += ` AND v.fuel_type ILIKE $${paramIndex++} `;
             queryParams.push(extractedEntities.fuel_type); // Match exact fuel type from NLP
        }

        dbQuery += ` ORDER BY v.created_at DESC`;

        // --- Step 3: Execute Query ---
        console.log("Executing DB Query:", dbQuery); // Log for debugging
        console.log("Query Params:", queryParams); // Log for debugging
        const results = await pool.query(dbQuery, queryParams);

        // --- Step 4: Format and Return Results ---
         const vehicles = formatVehicleResults(results.rows);
        res.json(vehicles);

    } catch (err) {
        console.error("Error during NLP search:", err);
        // Fallback to basic search on any error during processing
        await fallbackKeywordSearch(queryText, res);
    }
});

// ++ Helper function for formatting results (to avoid repetition)
function formatVehicleResults(rows) {
  return rows.map(row => ({
      id: row.id,
      title: row.title,
      price: row.price ? Number(row.price).toLocaleString() : 'N/A',
      location: row.location,
      mileage: row.mileage ? `${row.mileage.toLocaleString()} km` : 'N/A',
      fuel: row.fuel,
      image: row.image ? `http://localhost:${port}${row.image}` : '/placeholder.svg',
      make: row.make,
      model: row.model, // Include model and year if available
      year: row.year,
      seller_id: row.seller_id,
      seller_name: row.seller_name,
      seller_phone: row.seller_phone,
      seller_email: row.seller_email,
      is_rentable: row.is_rentable,
      rating: 4.5 // Placeholder rating
  }));
}

// ++ Helper function for fallback keyword search
async function fallbackKeywordSearch(queryText, res) {
    console.log(`Falling back to keyword search for: "${queryText}"`);
    try {
         const searchTermPattern = `%${queryText.toLowerCase()}%`;
         const results = await pool.query(
            `SELECT
                v.id, v.title, v.price, v.location, v.mileage, v.fuel_type AS fuel, v.is_rentable, v.make, v.model, v.year,
                u.username AS seller_name, u.phone AS seller_phone, u.email AS seller_email, u.id AS seller_id,
                (SELECT vi.image_url FROM vehicle_images vi WHERE vi.vehicle_id = v.id LIMIT 1) AS image
            FROM vehicles v
            JOIN users u ON v.user_id = u.id
            WHERE LOWER(v.title) LIKE $1
               OR LOWER(v.make) LIKE $1
               OR LOWER(v.model) LIKE $1
               OR LOWER(v.location) LIKE $1
               OR LOWER(v.description) LIKE $1
            ORDER BY v.created_at DESC`,
            [searchTermPattern]
        );
        const vehicles = formatVehicleResults(results.rows);
        res.json(vehicles); // Send keyword results
    } catch (fallbackErr) {
        console.error("Error during fallback keyword search:", fallbackErr);
        res.status(500).send("Error processing search query.");
    }
}

// ++ NEW/MODIFIED: Endpoint to log user interactions
app.post('/api/interactions/log', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    // Type can be 'view' or 'search'
    const { type, vehicleId, queryText, extractedEntities } = req.body;

    if (!type || !userId) {
        return res.status(400).send("Missing interaction type or user info.");
    }

    try {
        if (type === 'view' && vehicleId) {
            // Log vehicle view using ON CONFLICT to update timestamp
            await pool.query(
                `INSERT INTO user_vehicle_views (user_id, vehicle_id, viewed_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (user_id, vehicle_id)
                 DO UPDATE SET viewed_at = NOW()`,
                [userId, vehicleId]
            );
            console.log(`Logged view for user ${userId}, vehicle ${vehicleId}`);

        } else if (type === 'search' && queryText) {
            // Log search query using your search_logs table
            await pool.query(
                `INSERT INTO search_logs (user_id, search_text, created_at, extracted_make, extracted_model, extracted_location, extracted_year, extracted_min_price, extracted_max_price, extracted_fuel_type)
                 VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9)`,
                [
                    userId,
                    queryText,
                    extractedEntities?.make || null,
                    extractedEntities?.model || null,
                    extractedEntities?.location || null,
                    extractedEntities?.year || null,
                    extractedEntities?.min_price || null,
                    extractedEntities?.max_price || null,
                    extractedEntities?.fuel_type || null,
                ]
            );
             console.log(`Logged search for user ${userId}: "${queryText}"`);
        } else {
             return res.status(400).send("Invalid interaction type or missing required data.");
        }
        res.status(201).send("Interaction logged.");
    } catch (err) {
        console.error("Error logging interaction:", err);
        res.status(500).send("Server error");
    }
});

// ++ MODIFIED: Endpoint to get recommendations FOR the logged-in user FROM DB
app.get('/api/recommendations', authenticateToken, async (req, res) => {
    // Ensure req.user exists and has an id
    if (!req.user || typeof req.user.id === 'undefined') {
        console.error("[API /recommendations] Error: User ID not found in token payload.");
        return res.status(401).send("User not properly authenticated.");
    }

    const userIdFromToken = req.user.id;
    const numRecs = req.query.num || 5; // Default to 5 recommendations

    // ++ FIX: Log the ID and its type from the token ++
    console.log(`[API /recommendations] Attempting fetch for user ID from token: ${userIdFromToken} (Type: ${typeof userIdFromToken})`);

    // ++ FIX: Explicitly parse the user ID to an integer ++
    const userId = parseInt(userIdFromToken, 10);

    // Check if parsing failed (e.g., if id wasn't a number string)
    if (isNaN(userId)) {
        console.error(`[API /recommendations] Error: Failed to parse user ID '${userIdFromToken}' as integer.`);
        return res.status(400).send("Invalid user identifier.");
    }

    console.log(`[API /recommendations] Querying recommendations table for user_id: ${userId} (Type: ${typeof userId})`);


    try {
        // --- Step 1: Query the recommendations table ---
        const recQuery = `
            SELECT r.vehicle_id
            FROM recommendations r
            WHERE r.user_id = $1 -- Use the parsed integer ID
            ORDER BY r.score DESC, r.created_at DESC
            LIMIT $2
        `;
        // ++ FIX: Pass the parsed integer 'userId' to the query ++
        const recResult = await pool.query(recQuery, [userId, numRecs]);
        const recommendedIds = recResult.rows.map(row => row.vehicle_id);

        console.log(`[API /recommendations] Found ${recommendedIds.length} recommendation IDs in DB for user ${userId}:`, recommendedIds);


        let vehicles = [];
        if (recommendedIds.length > 0) {
            // --- Step 2: Fetch full vehicle details ---
            const placeholders = recommendedIds.map((_, i) => `$${i + 1}`).join(',');
            const detailsQuery = `
                SELECT
                    v.id, v.title, v.price, v.location, v.mileage, v.fuel_type AS fuel, v.is_rentable, v.make, v.model, v.year,
                    u.username AS seller_name, u.phone AS seller_phone, u.email AS seller_email, u.id AS seller_id,
                    (SELECT vi.image_url FROM vehicle_images vi WHERE vi.vehicle_id = v.id LIMIT 1) AS image
                FROM vehicles v
                JOIN users u ON v.user_id = u.id
                WHERE v.id IN (${placeholders})
            `;

            const detailsResult = await pool.query(detailsQuery, recommendedIds);
            const fetchedVehicles = formatVehicleResults(detailsResult.rows); // Use existing helper

             // --- Step 3: Reorder results ---
             vehicles = recommendedIds.map(id => fetchedVehicles.find(v => v.id === id)).filter(Boolean);
        } else {
             // This log is now expected if the DB query returned no rows
             console.log(`[API /recommendations] No pre-calculated recommendations found in DB for user ${userId}. Using fallback.`);
             // Fallback logic remains the same
             const fallbackResult = await pool.query(`
                 SELECT v.id, v.title, v.price, v.location, v.mileage, v.fuel_type AS fuel, v.is_rentable, v.make, v.model, v.year,
                        u.username AS seller_name, u.phone AS seller_phone, u.email AS seller_email, u.id AS seller_id,
                        (SELECT vi.image_url FROM vehicle_images vi WHERE vi.vehicle_id = v.id LIMIT 1) AS image
                 FROM vehicles v JOIN users u ON v.user_id = u.id
                 ORDER BY v.created_at DESC LIMIT 4
             `);
             vehicles = formatVehicleResults(fallbackResult.rows);
        }

        console.log(`[API /recommendations] Sending ${vehicles.length} vehicle objects to user ${userId}.`);
        res.json(vehicles);

    } catch (err) {
        console.error(`[API /recommendations] Error fetching recommendations for user ${userId}:`, err);
        res.status(500).send("Server error fetching recommendations.");
    }
});

// --- ADMIN ENDPOINTS ---

// GET All Users (Admin Only)
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, phone, role, created_at FROM users ORDER BY id ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error("[API /admin/users] Error fetching users:", err.message);
        res.status(500).send("Server error");
    }
});

// GET All Vehicles (Admin Only)
app.get('/api/admin/vehicles', authenticateToken, isAdmin, async (req, res) => {
    try {
        // **FIX:** The query now selects v.* to get ALL columns (description, year, etc.)
        // and includes a subquery to get the first image.
        const result = await pool.query(
            `SELECT
                v.*, -- This gets all columns from the vehicles table
                u.id as user_id, u.username as owner_username,
                (SELECT vi.image_url FROM vehicle_images vi WHERE vi.vehicle_id = v.id LIMIT 1) as image
             FROM vehicles v
             JOIN users u ON v.user_id = u.id
             ORDER BY v.created_at DESC`
        );
        
         // Format price and ensure image has full URL
         const vehicles = result.rows.map(row => ({
            ...row,
            // Convert price from decimal to string if needed, or just send raw
            // price: row.price ? Number(row.price).toLocaleString() : 'N/A', 
            image: row.image ? `${row.image}` : null // Just send the path
        }));

        res.json(vehicles); // Send the full vehicle objects

    } catch (err) {
        console.error("[API /admin/vehicles] Error fetching vehicles:", err.message);
        res.status(500).send("Server error");
    }
});

// PUT Update a User (Admin Only)
app.put('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { username, email, phone, role } = req.body; // Extract fields allowed to be updated

    // Validate role
    const allowedRoles = ['buyer', 'seller']; // Admins cannot be demoted/promoted via this UI for safety
    if (!allowedRoles.includes(role)) {
        return res.status(400).send("Invalid role specified.");
    }
    // Basic check to prevent admin from editing themselves
     if (req.user.id == id) {
         return res.status(400).send("Admin cannot change their own role via API.");
     }

    try {
        const result = await pool.query(
            `UPDATE users
             SET username = $1, email = $2, phone = $3, role = $4
             WHERE id = $5 AND role != 'admin' -- Prevent updating other admins here too
             RETURNING id, username, email, phone, role, created_at`, // Return updated data
            [username, email, phone, role, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).send("User not found, is an admin, or update failed.");
        }

        console.log(`[Admin Action] User ${req.user.id} updated user ${id}.`);
        res.status(200).json(result.rows[0]); // Send back the updated user object
    } catch (err) {
        console.error(`[API /admin/users/:id PUT] Error updating user ${id}:`, err.message);
        if (err.code === '23505') { // Handle unique constraint violation (e.g., email already exists)
            return res.status(409).send("Update failed: Email or username might already be in use.");
        }
        res.status(500).send("Server error during user update.");
    }
});

// DELETE a User (Admin Only)
app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
     // Basic check to prevent admin from deleting themselves (adjust if needed)
    if (req.user.id == id) {
        return res.status(400).send("Admin cannot delete their own account via API.");
    }
    try {
        // Note: ON DELETE CASCADE in vehicles table will delete user's vehicles
        // Be cautious about deleting users, consider soft deletes (adding an 'is_active' flag) instead
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0) {
            return res.status(404).send("User not found.");
        }
        console.log(`[Admin Action] User ${req.user.id} deleted user ${id}.`);
        res.status(200).json({ message: `User ${id} deleted successfully` });
    } catch (err) {
        console.error(`[API /admin/users/:id] Error deleting user ${id}:`, err.message);
        // Handle potential foreign key issues if cascade isn't set up everywhere
        res.status(500).send("Server error");
    }
});

// PUT Update a Vehicle (Admin Only)
app.put('/api/admin/vehicles/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    // These are the fields from the frontend modal
    const {
        title, description, price, make, model, year,
        mileage, fuel_type, transmission, location, is_rentable
    } = req.body;

    // Convert types for database
    const parsedPrice = parseFloat(price) || null;
    const parsedYear = parseInt(year, 10) || null;
    const parsedMileage = parseInt(mileage, 10) || null;

    try {
        const result = await pool.query(
            `UPDATE vehicles
             SET title = $1, description = $2, price = $3, make = $4, model = $5,
                 year = $6, mileage = $7, fuel_type = $8, transmission = $9,
                 location = $10, is_rentable = $11
             WHERE id = $12
             RETURNING id`, // Just return the ID
            [
                title, description, parsedPrice, make, model, parsedYear,
                parsedMileage, fuel_type, transmission, location, is_rentable,
                id
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).send("Vehicle not found or update failed.");
        }

        // After updating, re-fetch the *complete* vehicle data with joins
        // This is crucial to send the full object back to the frontend
        const updatedVehicleResult = await pool.query(
            `SELECT
                v.*,
                u.id as user_id, u.username as owner_username,
                (SELECT vi.image_url FROM vehicle_images vi WHERE vi.vehicle_id = v.id LIMIT 1) as image
             FROM vehicles v
             JOIN users u ON v.user_id = u.id
             WHERE v.id = $1`,
            [id]
        );
        
        if (updatedVehicleResult.rowCount === 0) {
             return res.status(404).send("Failed to re-fetch updated vehicle data.");
        }

        console.log(`[Admin Action] User ${req.user.id} updated vehicle ${id}.`);
        res.status(200).json(updatedVehicleResult.rows[0]); // Send back the full object

    } catch (err) {
        console.error(`[API /admin/vehicles/:id PUT] Error updating vehicle ${id}:`, err.message);
        res.status(500).send("Server error during vehicle update.");
    }
});

// DELETE a Vehicle (Admin Only)
app.delete('/api/admin/vehicles/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        // Deleting from vehicles will trigger cascade delete in vehicle_images, chats, recommendations, user_vehicle_views etc.
        const result = await pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING id, title', [id]);
        if (result.rowCount === 0) {
            return res.status(404).send("Vehicle not found.");
        }
        console.log(`[Admin Action] User ${req.user.id} deleted vehicle ${id} (${result.rows[0].title}).`);
        res.status(200).json({ message: `Vehicle ${id} deleted successfully` });
    } catch (err) {
        console.error(`[API /admin/vehicles/:id] Error deleting vehicle ${id}:`, err.message);
        res.status(500).send("Server error");
    }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});