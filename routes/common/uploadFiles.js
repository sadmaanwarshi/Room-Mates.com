// routes/pgRoutes.js
import express from 'express';
import fs from 'fs';
import pg from "pg";
import cloudinary from '../config/cloudinaryConfig.js';
import upload from '../config/multerLocalConfig.js';
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

router.post('/upload:pg_id', upload.single('image'), async (req, res) => {
  try {
    const localFilePath = req.file.path;
    const {pgId} = req.params;

    // Upload the image from local storage to Cloudinary
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: 'pg_images',
    });

    

    // Delete the local file after uploading to Cloudinary
    fs.unlink(localFilePath, (err) => {
      if (err) console.error("Failed to delete local file:", err);
      else console.log("Local file deleted after Cloudinary upload");
    });


    // Render the result in an EJS view with the Cloudinary URL
    res.render('uploadResult', { imageUrl: result.secure_url });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;
