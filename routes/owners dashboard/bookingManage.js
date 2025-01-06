import { Router } from "express";
import pg from "pg";
import isAuthenticated from "../../middleware/authenticate.js";
import sendBookingConfirmation from "../common/confirmEmailTemplate.js";
import sendBookingRejection from "../common/rejectEmailTemplate.js";
import dotenv from 'dotenv';

dotenv.config(); 

const router = Router();

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect();

router.get("/bookings/manage", isAuthenticated, async (req, res) => {
  // extract datas
  const owner_id = req.user.id;
  const user = req.session.user;
  const message = req.session.message || null;
  const errorMessage = req.session.error || null;

  // Clear session messages for subsequent requests
  req.session.message = null;
  req.session.error = null;

  // database qurries
  try {
    // Fetch bookings with corresponding PG listings details
            const query = `
                    SELECT 
            bookings.*, 
            pg_listings.pg_name, 
            students.firstname AS student_first_name, 
            students.lastname AS student_last_name, 
            students.phonenumber AS student_phonenumber,
            students.email AS student_email
        FROM 
            bookings
        INNER JOIN 
            pg_listings ON bookings.pg_id = pg_listings.id
        INNER JOIN 
            students ON bookings.stud_id = students.id
        WHERE 
            pg_listings.owner_id = $1;

        `;
    const result = await db.query(query, [owner_id]);

    // Check if there are bookings available
    if (result.rows.length === 0) {
      req.session.error = "No bookings found for your PGs.";
      return res.redirect(`/pg/owner/dashboard?user=${owner_id}`);
    }

    // Render the bookings page with data and messages
    res.render("owner/bookings", {
      user,
      bookings: result.rows, // sending all rows data
      message,
      error: errorMessage,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);

    // Set a session error message and redirect back
    req.session.error = "An error occurred while fetching bookings.";
    res.redirect(`/pg/owner/dashboard?user=${owner_id}`);
  }
});

// when user click approve booking
router.post(
  "/bookings/:pgId/approve/:id",
  isAuthenticated,
  async (req, res) => {
    const { pgId, id } = req.params;
    const owner_id = req.session.user.id;
    const user = req.session.user;

    try {
      const bookingResponse = await db.query(
        "SELECT * FROM bookings WHERE pg_id = $1 AND id = $2",
        [pgId, id]
      );

      if (bookingResponse.rows.length === 0) {
        req.session.error = " 404! Internal Error : Booking Not Aceepted!";
        return res.redirect(`/pg/owner/bookings/manage`);
        // return res.status(404).json({ error: "Booking not found." });
      }

      const roomsRequested = bookingResponse.rows[0].rooms_requested;

      const availableRoomResponse = await db.query(
        "SELECT available_rooms FROM pg_listings WHERE id = $1",
        [pgId]
      );
      const availableRoom = availableRoomResponse.rows[0].available_rooms;

      console.log(availableRoom);

      //check if room is available the book
      if (availableRoom > 0) {
        // Update the booking status to 'accepted'
        await db.query(
          "UPDATE bookings SET status = 'accepted' WHERE pg_id = $1 AND id = $2",
          [pgId, id]
        );
        // Update the available rooms in pg_listings
        await db.query(
          "UPDATE pg_listings SET available_rooms = available_rooms - $1 WHERE id = $2",
          [roomsRequested, pgId]
        );
      } else {
        req.session.error = " 404! No More Rooms Available!";
        return res.redirect(`/pg/owner/bookings/manage`);
        //    return res.status(401).json({error: "No More Rooms Available"});
      }
      const userid = bookingResponse.rows[0].stud_id;
      console.log(userid);
      const pgResponse = await db.query(
        "SELECT id,pg_name FROM pg_listings WHERE id = $1",
        [pgId]
      );
      const pgName = pgResponse.rows[0].pg_name;
      const userResponse = await db.query(
        "SELECT id, firstname, lastname, email FROM students WHERE id = $1",
        [userid]
      );
      const userDetails = userResponse.rows[0];
      const userEmail = userDetails.email;
      const userName = userDetails.firstname;
      const ownerName = user.owner_name;
      const ownerPhone = user.phone_number;
      const bookingRefrenceId = bookingResponse.rows[0].id;
      const bookingRefrencePgid = userDetails.id;
      const bookingRefrenceNumber = `RPG/ACPT/${bookingRefrenceId}/${bookingRefrencePgid}`;
      const checkIn = bookingResponse.rows[0].check_in;
      sendBookingConfirmation(
        `${userEmail}`, // User email
        `${userName}`, // User name
        `${pgName}`, // PG name
        bookingRefrenceNumber, // Booking reference number
        `${checkIn}`, // Check-in date
        `${ownerName}`, // Owner name
        `${ownerPhone}` // Owner phone
      );

      req.session.message = "Booking Accepted!";
      res.redirect(`/pg/owner/bookings/manage`);
    } catch (error) {
      console.error("Error accepting booking:", error);
      req.session.error = " 500! Failed to accept booking";
      res.redirect(`/pg/owner/bookings/manage`);
      // res.status(500).json({ error: "Failed to accept booking." });
    }
  }
);

router.post("/bookings/:pgId/reject/:id", isAuthenticated, async (req, res) => {
  const { pgId, id } = req.params;
  const owner_id = req.session.user.id;

  try {
    await db.query(
      "UPDATE bookings SET status = 'rejected' WHERE pg_id = $1 AND id = $2",
      [pgId, id]
    );
    req.session.message = "Booking Rejected!";

    const bookingResponse = await db.query(
      "SELECT * FROM bookings WHERE pg_id = $1 AND id = $2",
      [pgId, id]
    );
    const userid = bookingResponse.rows[0].stud_id;
    const pgResponse = await db.query(
      "SELECT pg_name FROM pg_listings WHERE id = $1",
      [pgId]
    );
    const pgName = pgResponse.rows[0].pg_name;
    const userResponse = await db.query(
      "SELECT id, firstname, lastname, email FROM students WHERE id = $1",
      [userid]
    );
    const userDetails = userResponse.rows[0];
    const userEmail = userDetails.email;
    const userName = userDetails.firstname;

    sendBookingRejection(
      `${userEmail}`, // User email
      `${userName}`, // User name
      `${pgName}`, // PG name
      "All rooms are currently booked. Please try again later." // Rejection reason
    );

    res.redirect(`/pg/owner/bookings/manage`);
    // res.redirect(`/pg/owner/dashboard?user=${owner_id}`);
  } catch (error) {
    console.error("Error rejecting booking:", error);
    req.session.error = " 500! Failed to reject booking.";
    res.redirect(`/pg/owner/bookings/manage`);
    // res.status(500).json({ error: "Failed to reject booking." });
  }
});

router.post("/bookings/:pgId/undo/:id", isAuthenticated, async (req, res) => {
  const { pgId, id } = req.params;

  try {
    // Fetch the current booking details
    const bookingResponse = await db.query(
      "SELECT * FROM bookings WHERE pg_id = $1 AND id = $2",
      [pgId, id]
    );

    if (bookingResponse.rows.length === 0) {
      req.session.error = " 404! Booking Not Found.";
      return res.redirect(`/pg/owner/bookings/manage`);
      // return res.status(404).json({ error: "Booking not found." });
    }

    //extract information from db
    const currentStatus = bookingResponse.rows[0].status;
    const roomsRequested = bookingResponse.rows[0].rooms_requested;

    //check if already in pending
    if (currentStatus === "pending") {
      return res
        .status(400)
        .json({ error: "Booking is already in 'pending' state." });
    }

    // Undo the booking response and reset status to 'pending'
    await db.query(
      "UPDATE bookings SET status = 'Pending' WHERE pg_id = $1 AND id = $2",
      [pgId, id]
    );

    // Adjust available rooms based on the current status
    if (currentStatus === "accepted") {
      // Increase the available rooms since the booking was previously accepted
      await db.query(
        "UPDATE pg_listings SET available_rooms = available_rooms + $1 WHERE id = $2",
        [roomsRequested, pgId]
      );
    } else if (currentStatus === "rejected") {
      console.log("Booking Status Changed");
      // No room adjustment needed for a rejected booking
      // (Optional: you could log this if needed)
    }
    req.session.message = "Booking response undone, status reset to 'pending'.";
    res.redirect(`/pg/owner/bookings/manage`);
    // res.status(200).json({ message: "Booking response undone, status reset to 'pending'." });
  } catch (error) {
    console.error("Error undoing booking response:", error);
    req.session.error = " 500! Failed to undo booking response.";
    res.redirect(`/pg/owner/bookings/manage`);
    // res.status(500).json({ error: "Failed to undo booking response." });
  }
});

export default router;
