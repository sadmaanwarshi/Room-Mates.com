// config/multerLocalConfig.js
import multer from 'multer';

// Use memory storage instead of diskStorage
const storage = multer.memoryStorage();

// Create a Multer upload middleware
const upload = multer({ storage });
export default upload;
