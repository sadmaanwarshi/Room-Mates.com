// multerConfig.js
import multer from 'multer';
import cloudinary from './cloudinaryConfig';  // Import Cloudinary config
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Set up multer to directly upload files to Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary.v2,  // Use the cloudinary instance from config
    params: {
        folder: 'pg_images',  // Define the folder to store images in Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],  // Allowed image formats
    }
});

// Create multer middleware
const upload = multer({ storage: storage });

export default upload;
