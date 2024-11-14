import { Router } from "express";
import pg from "pg";
import isAuthenticated from "../../middleware/authenticate.js";
const router = Router();

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "paying-guest-db",
    password: "Sad@7562",
    port: 5432,
});

db.connect();

// Route to get PG latitude and longitude by pg_id
router.get("/pglocation/:pg_id", isAuthenticated,async (req, res) => {
    const { pg_id } = req.params;
    console.log(`Received request for PG location. PG ID: ${pg_id}`);

    try {
        const result = await db.query(
            "SELECT latitude, longitude FROM pg_listings WHERE id = $1",
            [pg_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "PG listing not found" });
        }

        const { latitude, longitude } = result.rows[0];

        // Send the latitude and longitude to the frontend
        res.status(200).json({ latitude, longitude });
    } catch (err) {
        console.error("Error fetching PG location:", err);
        res.status(500).json({ error: "Failed to fetch location" });
    }
});

export default router;
