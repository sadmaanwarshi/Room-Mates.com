import express from 'express';
import pg from 'pg';
import isAuthenticated from '../../middleware/authenticate.js';

const router = express.Router();

// Set up your PostgreSQL connection
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "paying-guest-db",
    password: "Sad@7562",
    port: 5432
});

db.connect();

// Route to handle search by location
router.get("/search/location", isAuthenticated, async (req, res) => {
    const { search } = req.query; // Single search query from frontend
    const user = req.session.user; // Extracting user ID from session

    let message = ''; // Initialize message variable

    // Check if search query is provided
    if (!search) {
        message = "Search query is required.";
        return res.status(400).render('student/dashboard', { error: message, listings: [], user, message });
    }

    try {
            // Search PG listings by city or address
    const query = `
    SELECT 
        pg_listings.id,
        pg_listings.pg_name,
        pg_listings.city,
        pg_listings.address,
        pg_listings.main_image,
        pg_listings.amenities, 
        pg_room_info.preferred_tenants, 
        pg_room_info.description,
        pg_room_info.preferred_gender, 
        pg_room_info.rent_type, 
        pg_room_info.room_type,
        pg_cost_details.price_per_month,  
        pg_cost_details.food_availabilty, 
        pg_cost_details.food_type,
        pg_nearby_location_details.nearby_universities,
        pg_nearby_location_details.nearby_organizations,
        pg_nearby_location_details.nearby_locations
    FROM pg_listings
    LEFT JOIN pg_room_info ON pg_listings.id = pg_room_info.pg_id
    LEFT JOIN pg_cost_details ON pg_listings.id = pg_cost_details.pg_id
    LEFT JOIN pg_nearby_location_details ON pg_listings.id = pg_nearby_location_details.pg_id
    LEFT JOIN pg_rules_new ON pg_listings.id = pg_rules_new.pgid
    WHERE 
        LOWER(pg_listings.city) = LOWER($1) 
        OR LOWER(pg_listings.address) ILIKE '%' || LOWER($1) || '%'
    LIMIT 100; -- Limit results for performance
`;

const result = await db.query(query, [search]);

if (result.rows.length === 0) {
    message = `No PGs found for "${search}"`;
    return res.status(404).render('student/dashboard', {
        message,
        listings: [],
        user,
        error: null // Clear error state
    });
}

        // Extract the city name from the first result (assuming PGs have a city)
        const cityFromResult = result.rows[0].city;

        // Save the found city in the session
        req.session.city = cityFromResult;

        // Set a success message for found listings
        message = `PG listings found for "${search}"!`;

        // Render the dashboard with search results
        return res.status(200).render('student/dashboard', {
            message,
            listings: result.rows,
            savedCity: cityFromResult,
            user,
            error: null
        });

    } catch (err) {
        console.error('Error searching PG listings:', err);
        message = 'Failed to fetch PG listings.';
        return res.status(500).render('student/dashboard', { error: message, listings: [], user, message });
    }
});


export default router;
