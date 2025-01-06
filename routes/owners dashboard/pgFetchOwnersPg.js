import express from "express";
import pg from "pg";
import isAuthenticated from "../../middleware/authenticate.js";
import dotenv from 'dotenv';

dotenv.config(); 

const router = express.Router();

const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

db.connect();

// route to display Owner dashboard
router.get("/dashboard", isAuthenticated, async (req, res) => {
    const owner_id = req.query.user;
    const user = req.session.user;
    const errorMessage = req.session.error;
    const message = req.session.message || null;
    req.session.message = null;
    req.session.error = null;


    try {
        // fetch details to shown booking numbers length on badge
        const bookingResponse = await db.query("SELECT * FROM bookings WHERE owner_id = $1", [owner_id]);
        const bookingRequests = bookingResponse.rows.length;    

        // Select ALL owner's PG from Database based on their owner id
        const response = await db.query(`
            SELECT pg_listings.*, pg_room_info.*, pg_cost_details.* 
            FROM pg_listings
            LEFT JOIN pg_room_info ON pg_listings.id = pg_room_info.pg_id
            LEFT JOIN pg_cost_details ON pg_listings.id = pg_cost_details.pg_id
            WHERE pg_listings.owner_id = $1
            ORDER BY pg_listings.created_at DESC
        `, [owner_id]);

        const listings = response.rows;

        // If PG is not available, send a message
        if (listings.length === 0) {
            res.render('owner/dashboard', { user, listings, message, error: "No PG uploaded yet", bookingRequests });
            return; // Ensure to return after rendering
        }

        // Send all responses including booking requests
        res.render('owner/dashboard', { user, listings, bookingRequests, message, error: errorMessage || null });
    } catch (err) {
        console.error('Error fetching PG listings:', err);
        res.status(500).json({ error: 'Failed to fetch PG listings' });
    }
});


export default  router;
