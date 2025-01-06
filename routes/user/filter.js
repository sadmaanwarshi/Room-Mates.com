import  express,{ Router }  from "express";
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

router.get("/fetch/filter", isAuthenticated, async (req, res) => {
    const { max_price, WiFi, meals, AC, Gym, Laundry, Parking, DrinkingWater, gender, rent_type } = req.query;
    const city = req.session.city;
    console.log(req.query);

    if (!city) {
        return res.status(400).json({ error: "City not found in session. Please search for a city first." });
    }

    let query = `
        SELECT *
        FROM pg_listings 
        JOIN pg_cost_details ON pg_listings.id = pg_cost_details.pg_id
        JOIN pg_nearby_location_details ON pg_listings.id = pg_nearby_location_details.pg_id
        JOIN pg_room_info ON pg_listings.id = pg_room_info.pg_id
        JOIN pg_rules_new ON pg_listings.id = pg_rules_new.pgid
        WHERE LOWER(pg_listings.city) = LOWER($1)
    `;
    let queryParams = [city];

    // Filtering by price
    if (max_price) {
        const parsedPrice = parseInt(max_price, 10);
        if (isNaN(parsedPrice)) {
            return res.status(400).json({ error: "Invalid price format." });
        }
        queryParams.push(parsedPrice);
        query += ` AND pg_cost_details.price_per_month <= $${queryParams.length}`;
    }

    // Filtering by gender
    if (gender) {
        queryParams.push(gender);
        query += ` AND pg_room_info.preferred_gender = $${queryParams.length}`;
    }
    
    // Filtering by rent type
    if (rent_type) {
        queryParams.push(rent_type);
        query += ` AND pg_room_info.rent_type = $${queryParams.length}`;
    }

    // Filtering by amenities using JSONB fields in pg_listings
    if (WiFi === "true") {
        query += ` AND pg_listings.amenities->>'WiFi' = 'true'`;
    }
    if (meals === "true") {
        query += ` AND pg_cost_details.food_availabilty = true`;
    }
    if (AC === "true") {
        query += ` AND pg_listings.amenities->>'AC' = 'true'`;
    }

    if (Gym === "true") {
        query += ` AND pg_listings.amenities->>'Gym' = 'true'`;
    }

    if (Laundry=== "true") {
        query += ` AND pg_listings.amenities->>'Laundry' = 'true'`;
    }

    if (Parking=== "true") {
        query += ` AND pg_listings.amenities->>'Parking' = 'true'`;
    }

    if (DrinkingWater=== "true") {
        query += ` AND pg_listings.amenities->>'DrinkingWater' = 'true'`;
    }

    try {
        const result = await db.query(query, queryParams);

        res.render("student/dashboard", {
            listings: result.rows, // Pass the filtered listings
            savedCity: city, // Pass the city from session
            user: req.user, // Pass user info
            message: null, // No message for this case
            error: null // No error for this case
        });
    } catch (err) {
        console.error("Error fetching PG listings:", err);
        res.status(500).json({ error: "Failed to fetch listings" });
    }
});



export default router;