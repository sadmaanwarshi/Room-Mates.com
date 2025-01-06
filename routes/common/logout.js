import express, { Router } from "express"
const router = express.Router();
// Logout Route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error while logging out.');
        }
        // Redirect to home or login page after logout
        res.redirect('/');  // or '/home' depending on your preference
    });
});

export default router;