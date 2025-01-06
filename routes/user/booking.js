import express from "express";
// import nodemailer from "nodemailer"; // For email notifications
import pg from "pg";
import isAuthenticated from "../../middleware/authenticate.js";
import sendTemplateMessage from "../common/emailTemplate.js";
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



// when user submit a book route
router.post("/book/pg/:pgId", isAuthenticated, async (req, res) => {
    const { pgId } = req.params;
    const user = req.session.user;
    const { leaseYear, roomsRequested, checkIn } = req.body;
    
    // if user not exist
    if (!user || !user.id) {
        req.session.message = 'Please log in to book a PG.';
        return res.redirect('/auth/page/login/student');
    }

    if (!leaseYear || !roomsRequested || !checkIn) {
        req.session.error = 'All booking details are required.';
        return res.redirect(`/home/student/dashboard`);
    }

    try {
        // Fetch PG details and available rooms in a single query
        const pgData = await db.query(`
            SELECT owner_id, available_rooms 
            FROM pg_listings 
            WHERE id = $1`, [pgId]);

        if (!pgData.rows[0]) {
            req.session.error = 'PG not found.';
            return res.redirect(`/home/student/dashboard`);
        }

        const { owner_id, available_rooms } = pgData.rows[0];
        if (available_rooms < roomsRequested) {
            req.session.error = 'Booking failed! Not enough rooms available.';
            return res.redirect(`/home/student/dashboard`);
        }

        // Fetch room type
        const roomTypeResult = await db.query(
            "SELECT rent_type FROM pg_room_info WHERE pg_id = $1", [pgId]
        );
        const rentType = roomTypeResult.rows[0]?.rent_type || 'N/A';

        // Insert booking
        await db.query(`
            INSERT INTO bookings 
            (owner_id, stud_id, pg_id, lease_year, rooms_requested, rent_type, check_in) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [owner_id, user.id, pgId, leaseYear, roomsRequested, rentType, checkIn]
        );

        // Fetch owner email and send notification
        const ownerResult = await db.query(
            "SELECT email, owner_name FROM owners WHERE id = $1", [owner_id]
        );
        const { email: adminEmail, owner_name: adminName } = ownerResult.rows[0];
        const userName = `${user.firstname} ${user.lastname}`;
        const userEmail = user.email;
        const userPhone = user.phonenumber;

        sendTemplateMessage(adminEmail, adminName, userName, userEmail, userPhone, checkIn);

        req.session.message = 'Booking request sent successfully!';
        return res.redirect(`/home/student/dashboard`);

    } catch (error) {
        console.error('Error processing booking:', error);
        req.session.error = 'Internal Server Error. Please try again later.';
        return res.redirect(`/home/student/dashboard`);
    }
});


export default router;
