import { Router } from "express";
import pg from "pg";
import isAuthenticated from "../../middleware/authenticate.js";

const router = Router();

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "paying-guest-db",
    password: "Sad@7562",
    port: 5432
});

db.connect();

async function fetchOwnerListings(owner_id) {
    return await db.query(`
        SELECT pg_listings.*, pg_room_info.*, pg_cost_details.* 
        FROM pg_listings
        LEFT JOIN pg_room_info ON pg_listings.id = pg_room_info.pg_id
        LEFT JOIN pg_cost_details ON pg_listings.id = pg_cost_details.pg_id
        WHERE pg_listings.owner_id = $1
    `, [owner_id]);
}


router.get("/bookings/manage", isAuthenticated, async (req, res) => {
    const owner_id = req.user.id;
    const user = req.session.user;
    console.log(`pg id is ${owner_id}`);

    try {
        const result = await db.query("SELECT * FROM bookings WHERE owner_id = $1 ",[owner_id]);
        
        if(result.rows.length === 0){
            res.status(403).json({error:"No booking found"})
        }
        res.render("owner/bookings", {user, bookings: result.rows });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings.' });
    }
});

router.post("/bookings/:pgId/approve", isAuthenticated, async (req, res) => {
    const { pgId } = req.params;
    const owner_id = req.session.user.id; // Make sure the user ID is correctly set in the session
    console.log("Owner ID:", owner_id); // Debugging line to check the owner ID

    try {
        // Fetch the booking details to get rooms_requested
        const bookingResponse = await db.query("SELECT * FROM bookings WHERE pg_id = $1", [pgId]);
        
        if (bookingResponse.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found.' });
        }

        const roomsRequested = bookingResponse.rows[0].rooms_requested;

        // Update the booking status to 'accepted'
        await db.query("UPDATE bookings SET status = 'accepted' WHERE pg_id = $1", [pgId]);

        // Update the available rooms in pg_listings
        await db.query("UPDATE pg_listings SET available_rooms = available_rooms - $1 WHERE id = (SELECT owner_id FROM pg_listings WHERE id = $2)", [roomsRequested, pgId]);

        // Optionally, you can notify the user via email about their booking acceptance here

        // Set a success message in the session
        req.session.message = 'Booking accepted!';

        // Redirect back to the dashboard
        res.redirect(`/pg/owner/dashboard?user=${owner_id}`);
    } catch (error) {
        console.error('Error accepting booking:', error);
        res.status(500).json({ error: 'Failed to accept booking.' });
    }
});


router.post("/bookings/:pgId/reject", isAuthenticated, async (req, res) => {
    const { pgId } = req.params;

    try {
        await db.query(`UPDATE bookings SET status = 'rejected' WHERE pg_id = $1`, [pgId]);

        // Notify user logic...
        // Again, you can send an email notification to the user regarding their booking rejection.

        res.status(200).json({ message: 'Booking rejected!' });
    } catch (error) {
        console.error('Error rejecting booking:', error);
        res.status(500).json({ error: 'Failed to reject booking.' });
    }
});

export default router;