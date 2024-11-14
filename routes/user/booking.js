import express from "express";
// import nodemailer from "nodemailer"; // For email notifications
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



router.get("/booking/form/:pgId", isAuthenticated, async (req, res) => {
        const { pgId } = req.params;
        const user = req.session.user
        const message = req.session.message;
        req.session.message = null; // Clear the message after reading
        try {
            // Fetch PG details from the database
            const query = 'SELECT * FROM pg_listings,pg_cost_details,pg_nearby_location_details,pg_room_info, pg_rules_new WHERE pg_listings.id = $1';
            const pgResult = await db.query(query, [parseInt(pgId, 10)]); // Convert id to integer
            const pg = pgResult.rows[0];
    
            if (!pg) {
                return res.status(404).json({ error: "PG not found." });
            }
    
            // Render the booking form and pass PG details
            res.render("student/bookingForm", { pgId: pgId, pg: pg , user, message});
        } catch (error) {
            console.error("Error fetching PG details:", error);
            req.session.message = 'Booking failed! Server Error! Contact Admin';
            res.status(500).redirect(`/pg/user/fetch/pgdetail/${pgId}`);
        }
    });




router.post("/book/pg/:pgId", isAuthenticated, async (req, res) => {
    console.log(req.body)
    const { pgId } = req.params;
    const user = req.session.user;
    const {
        fullName, address, state, policeStation, city, pincode, Block, rentType,
        university, course, duration, fatherName, checkIn
    } = req.body;

    const roomsRequested = rentType;

    console.log("pgId:", pgId); // Debug log for pgId
    
    try {
        const pgResult = await db.query(`SELECT owner_id FROM pg_listings WHERE id = $1`, [pgId]);
        const pg = pgResult.rows[0];
        
        if (!pg) {
            return res.status(404).json({ error: "PG not found." });
        }

        const pgRoomAvailable = await db.query("SELECT available_rooms FROM pg_listings WHERE id = $1", [pgId]);
        if (pgRoomAvailable.rows[0].available_rooms < roomsRequested) {
            req.session.message = 'Booking failed! Not Available Required Quantity ';
            return res.status(400).redirect(`/pg/user/booking/form/${pgId}`);
        }
        // Insert booking with owner_id
        await db.query(
            `INSERT INTO bookings 
            (owner_id, user_id, pg_id, full_name, father_name, address, police_station, city, state, block, pincode, university, course, duration, check_in, rooms_requested, rent_type) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            [pg.owner_id, req.user.id, pgId, fullName, fatherName ,address, policeStation, city, state, Block, pincode,  university, course, duration, checkIn,roomsRequested, rentType]
        );
        

        // Send email notification to admin
        // const transporter = nodemailer.createTransport({
        //     service: 'Gmail',
        //     auth: {
        //         user: 'your_email@gmail.com',
        //         pass: 'your_email_password'
        //     }
        // });

        // const mailOptions = {
        //     from: 'your_email@gmail.com',
        //     to: 'admin_email@example.com',
        //     subject: 'New Booking Request',
        //     text: `New booking request from ${fullName} for PG ID: ${pgId}. Check-In: ${checkIn}, Check-Out: ${checkOut}.`
        // };

        // await transporter.sendMail(mailOptions);

        // res.status(200).json({ message: 'Booking request sent successfully!' });
        res.render('student/dashboard',{ user: user, message:"Booking request sent successfully!" , error:null, listings: []})

    } catch (error) {
        console.error('Error booking PG:', error);
        res.status(500).json({ error: 'Failed to book PG.' });
    }
});

export default router;
