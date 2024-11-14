const isAuthenticated = (req, res, next) => {
    // req.isAuthenticated() is available automatically once passport is set up
    if (req.isAuthenticated()) {
        return next(); // User is authenticated, proceed to the next middleware/route
    }
    return res.status(401).json({ message: "You need to log in to access this resource." });
};

export default isAuthenticated;