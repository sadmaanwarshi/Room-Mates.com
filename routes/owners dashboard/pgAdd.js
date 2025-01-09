import { Router } from "express";
import axios from "axios";
import pg from "pg";
import multer from "multer";
import cloudinary from "../../config/cloudinaryConfig.js";
import dotenv from "dotenv";
import isAuthenticated from "../../middleware/authenticate.js";

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

// Multer storage configuration for streaming uploads directly
const storage = multer.memoryStorage();
const upload = multer({ storage });

async function getGeocode(address) {
  const apiKey = process.env.OLA_APIKEY;
  const url = `https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(
    address
  )}&language=english&api_key=${apiKey}`;

  try {
    const response = await axios.get(url, { timeout: 10000 });

    if (
      response.data.geocodingResults &&
      response.data.geocodingResults.length > 0
    ) {
      const location = response.data.geocodingResults[0].geometry.location;
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
  res.render("owner/addPgForm", { user }); // Render the form view for adding a new PG listing
});

router.post(
  "/add",
  isAuthenticated,
  upload.fields([{ name: "mainImage" }, { name: "additionalImages" }]),
  async (req, res) => {
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

    const mainImage = req.files["mainImage"]
      ? req.files["mainImage"][0]
      : null;
    const additionalImages = req.files["additionalImages"] || [];

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
      PowerBackup: "false",
      Bed: "false",
    };

    if (amenities && Array.isArray(amenities)) {
      amenities.forEach((amenity) => {
        if (amenitiesObject.hasOwnProperty(amenity)) {
          amenitiesObject[amenity] = "true";
        }
      });
    }

    const amenitiesJson = JSON.stringify(amenitiesObject);
    const ownerId = req.user.id;

    try {
      const geocode = await getGeocode(`${address}, ${city}`);
      const { latitude, longitude } = geocode;

      let mainImageUrl = null;
      if (mainImage) {
        const mainImageResult = await cloudinary.uploader.upload_stream({
          folder: "pg_images",
        });
        mainImageUrl = mainImageResult.secure_url;
      }

      const additionalImageUrls = [];
      for (const file of additionalImages) {
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "pg_images" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });
        additionalImageUrls.push(uploadResult.secure_url);
      }

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
      const { rows } = await db.query(pgListingsQuery, pgListingsValues);
      const pgId = rows[0].id;

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
      await db.query(pgRoomInfoQuery, pgRoomInfoValues);

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
      await db.query(pgCostDetailsQuery, pgCostDetailsValues);

      const pgNearbyLocationDetailsQuery = `
        INSERT INTO pg_nearby_location_details (pg_id, nearby_universities, nearby_organizations, nearby_locations)
        VALUES ($1, $2, $3, $4)
      `;
      const pgNearbyLocationDetailsValues = [
        pgId,
        nearbyUniversities,
        nearbyOrganizations,
        nearbyLocations.split(", "),
      ];
      await db.query(pgNearbyLocationDetailsQuery, pgNearbyLocationDetailsValues);

      const pgRulesQuery = `
        INSERT INTO pg_rules_new (pgid, custom_rule)
        VALUES ($1, $2)
      `;
      const pgRulesValues = [pgId, rules];
      await db.query(pgRulesQuery, pgRulesValues);

      res.redirect(`/pg/owner/dashboard?user=${ownerId}`);
    } catch (error) {
      console.error("Error adding PG:", error);
      req.session.error = "500! Unable to add data.";
      res.redirect(`/pg/owner/dashboard?user=${ownerId}`);
    }
  }
);

export default router;
