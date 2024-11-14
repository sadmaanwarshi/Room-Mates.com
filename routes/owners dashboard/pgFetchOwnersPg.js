import express from "express";
import pg from "pg";
import isAuthenticated from "../../middleware/authenticate.js";

const router = express.Router();

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "paying-guest-db",
    password: "Sad@7562",
    port: 5432
});

db.connect();

router.get("/dashboard", isAuthenticated, async (req, res) => {
    const owner_id = req.query.user;
    const user = req.session.user;
    

    try {
        const bookingResponse = await db.query("SELECT * FROM bookings WHERE owner_id = $1", [owner_id]);
        const bookingRequests = bookingResponse.rows.length;    

        // Select ALL owner's PG from Database based on their owner id
        const response = await db.query(`
            SELECT pg_listings.*, pg_room_info.*, pg_cost_details.* 
            FROM pg_listings
            LEFT JOIN pg_room_info ON pg_listings.id = pg_room_info.pg_id
            LEFT JOIN pg_cost_details ON pg_listings.id = pg_cost_details.pg_id
            WHERE pg_listings.owner_id = $1
        `, [owner_id]);

        const listings = response.rows;

        // If PG is not available, send a message
        if (listings.length === 0) {
            res.render('owner/dashboard', { user, listings, message:null, error: "No PG uploaded yet", bookingRequests });
            return; // Ensure to return after rendering
        }

        // Send all responses including booking requests
        res.render('owner/dashboard', { user, listings, bookingRequests, message:null, error: null });
    } catch (err) {
        console.error('Error fetching PG listings:', err);
        res.status(500).json({ error: 'Failed to fetch PG listings' });
    }
});


export default  router;
