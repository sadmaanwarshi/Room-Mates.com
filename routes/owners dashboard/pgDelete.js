import express from "express";
import pg from "pg";
import isAuthenticated from "../../middleware/authenticate.js";


const router = express.Router();

// Database connection setup
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "paying-guest-db",
    password: "Sad@7562",
    port: 5432
});


db.connect();  // Ensure you connect to the database


// Delete PG listing route
router.delete("/delete/:id", isAuthenticated, async (req, res) => {
    const { id } = req.params; // Get PG id from the URL params
    const owner_id = req.user.id; // Get owner_id from the authenticated user

    try {
        // Verify that the PG listing belongs to the owner
        const pgQuery = 'SELECT * FROM pg_listings WHERE id = $1 AND owner_id = $2';
        const pgResult = await db.query(pgQuery, [id, owner_id]);

        // If no rows are found, return unauthorized error
        if (pgResult.rows.length === 0) {
            return res.status(403).json({ error: 'Unauthorized to delete this listing.' });
        }

        // Proceed with deleting the PG listing (cascades to related tables)
        const deleteResponse = await db.query(
            "DELETE FROM pg_listings WHERE id = $1 AND owner_id = $2 RETURNING *",
            [id, owner_id]
        );

        // If deleted successfully, respond with a success message
        if (deleteResponse.rowCount > 0) {
            res.status(200).json({
                message: 'PG listing deleted successfully!',
                deletedListing: deleteResponse.rows[0]
            });
        } else {
            res.status(404).json({ error: "PG listing is not available or unable to delete" });
        }
    } catch (err) {
        console.error('Error deleting PG listing:', err);
        res.status(500).json({ error: 'Failed to delete PG listing.' });
    }
});


export default router;
