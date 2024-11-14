import express from 'express';

const router = express.Router();

// Route to render the home page
router.get('/contact', (req, res) => {
    res.render('contact'); // Render the contact.ejs page
});

router.get('/', (req, res) => {
    res.render('index'); // Render the index.ejs file
});

export default router;
