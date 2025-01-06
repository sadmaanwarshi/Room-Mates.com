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

router.get("/student/dashboard", isAuthenticated, async (req, res) => {
    const search = req.session.searchLocation || null;
    const user = req.session.user;
    const message = req.session.message || null;
   
    console.log(search);
    // let message;

    if (!search) {
        return res.render('student/dashboard', { user: user, message: message, error: null, listings: [] });
    }
    // req.session.message = null; // Clear the message after reading
    // Redirect only if `search` exists
    return res.redirect(`/pg/user/search/location?search=${search}`);
});


export default router;