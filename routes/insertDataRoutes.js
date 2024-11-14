import { Router } from "express";
import axios from "axios";
import pg from "pg";
import isAuthenticated from "../middleware/authenticate.js";
const router = Router();

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "paying-guest-db",
    password: "Sad@7562",
    port: 5432
});

db.connect();

async function getGeocode(address) {
    const apiKey = 'dJ8jEv1ParnY4qqVrLhVwJvmy2CZfU9R0BFR73kQ'; // Wrap in quotes
    const url = `https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(address)}&language=english&api_key=${apiKey}`;

    try {
        const response = await axios.get(url);
        
        // Check if the response contains geocoding results
        if (response.data.geocodingResults && response.data.geocodingResults.length > 0) {
            const location = response.data.geocodingResults[0].geometry.location;
            // Extract latitude and longitude
            return {
                latitude: location.lat,
                longitude: location.lng
            };
        } else {
            throw new Error('No results found');
        }
    } catch (error) {
        console.error('Error fetching geocoding data:', error);
        throw new Error('Failed to get geocoding data from Ola Maps');
    }
}

router.post("/Add", isAuthenticated, async (req, res) => {
    // Extract details from the body
    const { name, address, city, alterphone, price, description,amenities} = req.body;
    
    const ownerId = req.user.id;  // Extract owner ID from the authenticated user
    console.log("owner id is: ", ownerId);
    console.log(req.body);
    try {
        // Get geocode (latitude, longitude) from the address
        const geocode = await getGeocode(`${address}, ${city}`);
        const { latitude, longitude } = geocode;
        const amenitiesJson = JSON.stringify(amenities);
        console.log(amenitiesJson);
        // Insert data into the database
        const result = await db.query(
            "INSERT INTO pg_listings (owner_id, pgname, address, city, alterphone, latitude, longitude, price_per_month, description,amenities) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
            [ownerId, name, address, city, alterphone, latitude, longitude, price, description, amenitiesJson]
        );

        // Send success response with inserted listing details
        res.status(201).json({ 
            message: 'PG Listing added successfully!', 
            listing: result.rows[0]  // You can return more details if needed
        });
    } catch (err) {
        console.error('Error inserting data into database:', err);
        res.status(500).json({ error: 'Unable to insert data into the database' });
    }
});

export default router;
