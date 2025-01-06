import express from 'express';
import axios from "axios";
import pg from 'pg';
import isAuthenticated from '../../middleware/authenticate.js';
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

async function getLocation(address) {
    const apiKey = process.env.OLA_APIKEY; // Wrap in quotes
    const url = `https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(
      address
    )}&language=english&api_key=${apiKey}`;
  
    try {
      const response = await axios.get(url);
  
      // Check if the response contains geocoding results
      if (
        response.data.geocodingResults &&
        response.data.geocodingResults.length > 0
      ) {
        const location = response.data.geocodingResults[0].address_components;
        const cityComponent = location.find(component => component.types.includes("locality"));

        console.log(cityComponent.long_name);
        // Extract latitude and longitude
        return cityComponent.long_name ? cityComponent.long_name : "City not found";

      } else {
        throw new Error("No results found");
      }
    } catch (error) {
      console.error("Error fetching geocoding data:", error);
      throw new Error("Failed to get geocoding data from Ola Maps");
    }
  }

// Route to handle search by location
router.get("/search/location", isAuthenticated, async (req, res) => {
    const { search } = req.query;
    const user = req.session.user;
    req.session.searchLocation = search;
    const sessionMessage = req.session.message;
    const sessionError = req.session.error;
    delete req.session.message;
    delete req.session.error;

    let message = '';
    let error = null;

    // Ensure search query is provided
    if (!search) {
        message = "Search query is required.";
        return res.status(400).render('student/dashboard', {
            error: message,
            listings: [],
            user,
            message,
        });
    }

    try {
        // Initial query
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
        LIMIT 100;
        `;

        let result = await db.query(query, [search]);

        // If no results found, try searching by locality
        if (result.rows.length === 0) {
            const locality = await getLocation(search);
            if (locality) {
                result = await db.query(query, [locality]);
            }
        }

        if (result.rows.length === 0) {
            error = `No accommodation found for "${search}". Try searching by a different name.`;
            return res.status(404).render('student/dashboard', {
                message: null,
                listings: [],
                user,
                error,
            });
        }

        // Extract city name from first result
        const cityFromResult = result.rows[0].city;

        // Save city in session
        if (!req.session.city) {
            req.session.city = cityFromResult;
        }

        // Set success message
        message = sessionMessage || `${result.rows.length} accommodation(s) found for "${search}"!`;

        // Render the dashboard with results
        return res.status(200).render('student/dashboard', {
            message,
            listings: result.rows,
            savedCity: cityFromResult,
            user,
            error: sessionError || null,
        });
    } catch (err) {
        console.error('Error searching PG listings:', err);
        message = 'Failed to fetch PG listings.';
        return res.status(500).render('student/dashboard', {
            error: message,
            listings: [],
            user,
            message,
        });
    }
});




export default router;
