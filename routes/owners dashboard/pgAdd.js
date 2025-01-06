import { Router } from "express";
import axios from "axios";
import pg from "pg";
import fs from "fs";
import isAuthenticated from "../../middleware/authenticate.js";
import cloudinary from "../../config/cloudinaryConfig.js";
import upload from "../../config/multerLocalConfig.js";
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

async function getGeocode(address) {
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
      const location = response.data.geocodingResults[0].geometry.location;
      // Extract latitude and longitude
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    } else {
      throw new Error("No results found");
    }
  } catch (error) {
    console.error("Error fetching geocoding data:", error);
    throw new Error("Failed to get geocoding data from Ola Maps");
  }
}

router.get("/form/add", isAuthenticated, (req, res) => {
  const user = req.session.user;
  res.render("owner/addPgForm", {user}); // Render the form view for adding a new PG listing
});

router.post(
  "/add",
  isAuthenticated,
  upload.fields([{ name: "mainImage" }, { name: "additionalImages" }]),
  async (req, res) => {
    // Extract details from the body
    const {
      ownerName,
      pgName,
      address,
      city,
      state,
      phoneNumber,
      alterPhoneNumber,
      priceMonthly,
      depositAmount,
      electricCharge,
      maintenanceCharge,
      noticePeriod,
      amenities,
      tenants,
      description,
      preferredGender,
      rentType,
      quantity,
      roomType,
      foodAvailability,
      foodType,
      rules,
      nearbyUniversities,
      nearbyOrganizations,
      nearbyLocations,
    } = req.body;

    console.log(req.body);

    const mainImagePath = req.files["mainImage"]
      ? req.files["mainImage"][0].path
      : null;
    const additionalImagesPaths = req.files["additionalImages"]
      ? req.files["additionalImages"].map((file) => file.path)
      : [];

    // Initialize an empty object for amenities
    const amenitiesObject = {
      AC: "false",
      WiFi: "false",
      DrinkingWater: "false",
      Parking: "false",
      Gym: "false",
      Pool: "false",
      Laundry: "false",
      Meal: "false",
      Veg: "false",
      Nonveg: "false",
      PowerBackup : "false",
      Bed: "false"
      // Add more amenities as needed
    };

    // Convert the amenities array into the desired object format
    if (amenities && Array.isArray(amenities)) {
      amenities.forEach((amenity) => {
        if (amenitiesObject.hasOwnProperty(amenity)) {
          amenitiesObject[amenity] = "true"; // Set to "true" for checked amenities
        }
      });
    }

    const amenitiesJson = JSON.stringify(amenitiesObject); // Convert the object to JSON format
    const ownerId = req.user.id; // Extract owner ID from the authenticated user

    try {
      // Get geocode (latitude, longitude) from the address
      const geocode = await getGeocode(`${address}, ${city}`);
      const { latitude, longitude } = geocode;

      // Handle main image upload
      let mainImageUrl;
      if (mainImagePath) {
        const mainImageResult = await cloudinary.uploader.upload(
          mainImagePath,
          {
            folder: "pg_images",
          }
        );
        mainImageUrl = mainImageResult.secure_url; // Getting link of main image

        // Unlink main image from temporary folder
        fs.unlink(mainImagePath, (err) => {
          if (err) console.error("Failed to delete main image file:", err);
          else
            console.log(
              "Main image local file deleted after Cloudinary upload"
            );
        });
      }

      // Handle array of images upload
      const additionalImageUrls = [];
      for (const path of additionalImagesPaths) {
        const imageResult = await cloudinary.uploader.upload(path, {
          folder: "pg_images",
        });
        additionalImageUrls.push(imageResult.secure_url); // Getting link of additional images

        // Unlink additional images from temporary folder
        fs.unlink(path, (err) => {
          if (err)
            console.error("Failed to delete additional image file:", err);
          else
            console.log(
              "Additional image local file deleted after Cloudinary upload"
            );
        });
      }

      // Insert data into the database
      //inserting on pg_listing table (main table)
      const pgListingsQuery = `
        INSERT INTO pg_listings (pg_name, address, city, state, latitude, longitude, phone_number, alternate_phone_number, main_image, images, amenities, owner_id, owner_name, available_rooms)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id
    `;
      const pgListingsValues = [
        pgName,
        address,
        city,
        state,
        latitude,
        longitude,
        phoneNumber,
        alterPhoneNumber,
        mainImageUrl,
        additionalImageUrls,
        amenitiesJson,
        ownerId,
        ownerName,
        quantity,
      ];
      const { rows } = await db.query(pgListingsQuery, pgListingsValues); // getting result rowa
      const pgId = rows[0].id; //extract pg_id from pg_listing table (main table)

      // Insert into pg_room_info table
      const pgRoomInfoQuery = `
      INSERT INTO pg_room_info (pg_id, notice_period, preferred_tenants, description, preferred_gender, rent_type, quantity, room_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;
      const pgRoomInfoValues = [
        pgId,
        noticePeriod,
        tenants,
        description,
        preferredGender,
        rentType,
        quantity,
        roomType,
      ];
      await db.query(pgRoomInfoQuery, pgRoomInfoValues); // simply passing values

      // Insert into pg_cost_details Table
      const pgCostDetailsQuery = `
       INSERT INTO pg_cost_details (pg_id, price_per_month, deposit_amount, electric_charge, maintenance_fee, food_availabilty, food_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
   `;
      const pgCostDetailsValues = [
        pgId,
        priceMonthly,
        depositAmount,
        electricCharge,
        maintenanceCharge,
        foodAvailability,
        foodType,
      ];
      await db.query(pgCostDetailsQuery, pgCostDetailsValues); //simply passing values

      // Insert into pg_nearby_location_details
      const pgNearbyLocationDetailsQuery = `
      INSERT INTO pg_nearby_location_details (pg_id, nearby_universities, nearby_organizations, nearby_locations)
      VALUES ($1, $2, $3, $4)
  `;
      
        const locationsArray = nearbyLocations.split(', '); //split into array nearby location
      const pgNearbyLocationDetailsValues = [
        pgId,
        nearbyUniversities,
        nearbyOrganizations,
        locationsArray,
      ];
      await db.query(
        pgNearbyLocationDetailsQuery,
        pgNearbyLocationDetailsValues
      ); // passing values

     // Assuming you already have pgId and customRule defined

// Insert into pg_rules
if (!rules || rules.length === 0) {
    return res.status(400).send('Please select at least one rule.');
}

// Assuming you already have pgId and customRule defined

// Insert into pg_rules
if (rules && rules.length > 0) {
    // Create a query to insert the pg_id and the array of rules
    const pgRulesQuery = `
        INSERT INTO pg_rules_new (pgid, custom_rule)
        VALUES ($1, $2)
    `;

    const pgRulesValues = [pgId, rules]; // Pass the array directly

    try {
        await db.query(pgRulesQuery, pgRulesValues);
    } catch (error) {
        console.error('Error inserting data into database:', error);
    }
}


      // Send success response with inserted listing details
      res.redirect(`/pg/owner/dashboard?user=${ownerId}`);
    } catch (err) {
      console.error("Error inserting data into database:", err);
      req.session.error = "500!  Unable to Add data into the webpage Database";
      res.redirect(`/pg/owner/dashboard?user=${ownerId}`);
      // res
      //   .status(500)
      //   .json({ error: "Unable to insert data into the database" });
    }
  }
);

export default router;
