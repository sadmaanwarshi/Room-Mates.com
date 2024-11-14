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



// Example route in your backend
router.get("/fetch/pgdetail/:id", isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const user = req.session.user;
    const message = req.session.message;
    req.session.message = null; // Clear the message after reading
    // Validate if `id` is an integer
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid PG ID.' });
    }

    try {
        // Assuming the foreign key in the related tables is also `pg_id`
        const query = `
            SELECT * 
            FROM pg_listings
            JOIN pg_cost_details ON pg_listings.id = pg_cost_details.pg_id
            JOIN pg_nearby_location_details ON pg_listings.id = pg_nearby_location_details.pg_id
            JOIN pg_room_info ON pg_listings.id = pg_room_info.pg_id
            JOIN pg_rules_new ON pg_listings.id = pg_rules_new.pgid
            WHERE pg_listings.id = $1
        `;
        const result = await db.query(query, [parseInt(id, 10)]); // Convert id to integer

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'PG not found.' });
        }

        const listing = result.rows[0];
        res.render("student/pgdetail", { listing, user,message });

    } catch (err) {
        console.error('Error fetching PG details:', err);
        res.status(500).json({ error: 'Failed to fetch PG details.' });
    }
});




export default router

