import express from "express";
import axios from "axios";
import pg from "pg";
import fs from "fs";
import isAuthenticated from "../../middleware/authenticate.js";
import cloudinary from "../../config/cloudinaryConfig.js";
import upload from "../../config/multerLocalConfig.js";
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

db.connect();  // Ensure you connect to the database

async function getGeocode(address) {
    const apiKey = process.env.OLA_APIKEY; // Wrap in quotes
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

// send pg details into update pg form page
router.get("/edit/:id", isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.id;
    const user = req.session.user;

    try {
        // Fetch the PG listing details to pre-fill the form
        const query = `
        SELECT * 
        FROM pg_listings
        JOIN pg_cost_details ON pg_listings.id = pg_cost_details.pg_id
        JOIN pg_nearby_location_details ON pg_listings.id = pg_nearby_location_details.pg_id
        JOIN pg_room_info ON pg_listings.id = pg_room_info.pg_id
        JOIN pg_rules_new ON pg_listings.id = pg_rules_new.pgid
        WHERE pg_listings.id = $1
    `;
    const result = await db.query(query, [parseInt(id, 10)]); // Convert id to integer


        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Listing not found or unauthorized." });
        }

        const listing = result.rows[0];
        
        // Render the form with the current PG listing details
        res.render("owner/updatePgForm", {user, listing});
    } catch (err) {
        console.error("Error fetching listing for editing:", err);
        res.status(500).json({ error: "Failed to fetch listing." });
    }
});


// Helper function to handle Cloudinary uploads and file deletion
async function uploadToCloudinaryFromBuffer(buffer) {
    try {
      // Upload the buffer directly using the 'file' option
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto', // Automatically detects the file type (e.g., image, video)
            folder: 'pg_images',   // Optional: specify folder in your Cloudinary account
          },
          (error, result) => {
            if (error) {
              reject(new Error("Cloudinary upload failed: " + error.message));
            }
            resolve(result);
          }
        ).end(buffer); // Pipe the buffer into Cloudinary's upload stream
      });
  
      // Return the secure URL of the uploaded image
      return result.secure_url;
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      throw new Error("Image upload failed.");
    }
  }
  


// Optimized route handler
router.post("/update/:id", isAuthenticated, upload.fields([{ name: "mainImage" }, { name: "additionalImages" }]), async (req, res) => {
    const { id } = req.params;
    const owner_id = req.user.id;

    const {
        pgName, address, city, state, phoneNumber, alterPhoneNumber,
        priceMonthly, depositAmount, electricCharge, maintenanceCharge,
        noticePeriod, amenities, tenants, description, preferredGender,
        rentType, quantity, roomType, foodAvailability, foodType, rules,
        nearbyUniversities, nearbyOrganizations,
    } = req.body;

    console.log(req.body);

    // Handle nearby locations
    let nearbyLocations = req.body.nearbyLocations ? req.body.nearbyLocations.split(',').map(item => item.trim()) : [];
    nearbyLocations = `{${nearbyLocations.join(',')}}`; // Format for PostgreSQL

   // File data from multer (buffer in memory)
   const mainImageBuffer = req.files["mainImage"] ? req.files["mainImage"][0].buffer : null;
   const additionalImagesBuffers = req.files["additionalImages"] ? req.files["additionalImages"].map(file => file.buffer) : [];


    try {
        // Verify ownership
        const pgQuery = 'SELECT * FROM pg_listings WHERE id = $1 AND owner_id = $2';
        const pgResult = await db.query(pgQuery, [id, owner_id]);

        if (pgResult.rows.length === 0) {
            return res.status(403).json({ error: 'Unauthorized to update this listing.' });
        }

        // Handle image uploads (directly to Cloudinary)
        const mainImageUrl = mainImageBuffer ? await uploadToCloudinaryFromBuffer(mainImageBuffer) : null;
        const additionalImageUrls = await Promise.all(additionalImagesBuffers.map(uploadToCloudinaryFromBuffer));

        // Check the image URL output in the logs
console.log("Main Image URL:", mainImageUrl);
console.log("Additional Image URLs:", additionalImageUrls);

        // Convert amenities to JSON
        const amenitiesObject = Object.fromEntries(["AC", "WiFi", "DrinkingWater", "Parking", "Gym", "Pool", "Laundry", "Meal", "Veg", "Nonveg"].map(key => [key, "false"]));
        if (Array.isArray(amenities)) amenities.forEach(amenity => amenitiesObject[amenity] = "true");
        const amenitiesJson = JSON.stringify(amenitiesObject);

        // Geocoding (assumes getGeocode is a function you've defined)
        let latitude = null, longitude = null;
        if (address) {
            const geocode = await getGeocode(`${address}, ${city}`);
            if (geocode) ({ latitude, longitude } = geocode);
        }

        // Prepare update queries
        const updateQueries = [
            {
                text: `
                    UPDATE pg_listings 
                    SET pg_name = COALESCE($1, pg_name),
                        address = COALESCE($2, address),
                        city = COALESCE($3, city),
                        state = COALESCE($4, state),
                        phone_number = COALESCE($5, phone_number),
                        alternate_phone_number = COALESCE($6, alternate_phone_number),
                        latitude = COALESCE($7, latitude),
                        longitude = COALESCE($8, longitude),
                        main_image = COALESCE($9, main_image),
                        images = COALESCE($10, images),
                        amenities = COALESCE($11, amenities),
                        available_rooms = COALESCE($12, available_rooms)
                    WHERE id = $13 AND owner_id = $14
                `,
                values: [
                    pgName, address, city, state, phoneNumber, alterPhoneNumber,
                    latitude, longitude, mainImageUrl, additionalImageUrls.length > 0 ? additionalImageUrls : null,
                    amenitiesJson, quantity, id, owner_id
                ]
            },
            {
                text: `
                    UPDATE pg_room_info
                    SET notice_period = COALESCE($1, notice_period),
                        preferred_tenants = COALESCE($2, preferred_tenants),
                        description = COALESCE($3, description),
                        preferred_gender = COALESCE($4, preferred_gender),
                        rent_type = COALESCE($5, rent_type),
                        quantity = COALESCE($6, quantity),
                        room_type = COALESCE($7, room_type)
                    WHERE pg_id = $8
                `,
                values: [noticePeriod, tenants, description, preferredGender, rentType, quantity, roomType, id]
            },
            {
                text: `
                    UPDATE pg_cost_details
                    SET price_per_month = COALESCE($1, price_per_month),
                        deposit_amount = COALESCE($2, deposit_amount),
                        electric_charge = COALESCE($3, electric_charge),
                        maintenance_fee = COALESCE($4, maintenance_fee),
                        food_availabilty = COALESCE($5, food_availabilty),
                        food_type = COALESCE($6, food_type)
                    WHERE pg_id = $7
                `,
                values: [priceMonthly, depositAmount, electricCharge, maintenanceCharge, foodAvailability, foodType, id]
            },
            {
                text: `
                    UPDATE pg_nearby_location_details
                    SET nearby_universities = COALESCE($1, nearby_universities),
                        nearby_organizations = COALESCE($2, nearby_organizations),
                        nearby_locations = COALESCE($3, nearby_locations)
                    WHERE pg_id = $4
                `,
                values: [nearbyUniversities, nearbyOrganizations, nearbyLocations, id]
            },
            {
                text: `
                    UPDATE pg_rules_new
                    SET custom_rule = COALESCE($1, custom_rule)
                    WHERE pgid = $2
                `,
                values: [rules, id]
            }
        ];

        // Execute all update queries in parallel
        await Promise.all(updateQueries.map(query => db.query(query.text, query.values)));

        // Redirect to the dashboard upon successful update
        res.redirect(`/pg/owner/dashboard?user=${owner_id}`);
    } catch (err) {
        console.error('Error updating PG listing:', err);
        req.session.error = "500! Failed to update PG listing.";
        res.redirect(`/pg/owner/dashboard?user=${owner_id}`);
        // res.status(500).json({ error: 'Failed to update PG listing.' });
    }
});




export default router;
