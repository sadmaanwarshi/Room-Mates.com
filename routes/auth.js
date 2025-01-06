import express, { Router } from "express"
import pg from "pg";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import passport from "passport";
import { Strategy } from "passport-local"; 
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

// Render Student Login Page
router.get('/page/login/student', (req, res) => {
    const message = req.session.message || null;
    
    delete req.session.message; 
    res.render('student/login', {message});
});

// Render Student Registration Page


// Render Owner Login Page
router.get('/page/login/owner', (req, res) => {
    const message = req.session.message || null;
    delete req.session.message; 
    res.render('owner/login' , {message});
});

// Render Owner Registration Page






router.post('/login/student', [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password cannot be blank').exists()
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() }); // Send validation errors
    }

    // Proceed with passport authentication 
    passport.authenticate('local-students', (err, user, info) => {
        if (err) {
            return next(err); // Handle any errors
        }
        //if user not exist or wrong input shown 
        if (!user) {
            return res.render('student/login',{ message: 'Invalid credentials' }); // If authentication fails
        }

        // If authentication succeeds, log the user in
        req.login(user, (err) => {
            if (err) {
                return next(err); // Handle login errors
            }
            const message = `Hello ${user.firstname} Start Searching Accomadation`
            req.session.user = req.user;
            //  res.render('student/dashboard',{ user: user, message , error:err, listings: []})
            res.redirect("/home/student/dashboard");
            // return res.status(200).json({ message: 'Login successful', user: user }); // Send success response
        });
    })(req, res, next);
});



router.post('/login/owner', [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password cannot be blank').exists()
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() }); // Send validation errors
    }

    // Proceed with passport authentication 
    passport.authenticate('local-owner',async (err, user, info) => {
        if (err) {
            return next(err); // Handle any errors
        }
        //if user not ewxist
        if (!user) {
            
            return res.status(401).json({ message: 'Invalid credentials' }); // If authentication fails
        }

        // If authentication succeeds, log the user in
        req.login(user, async(err) => {
            if (err) {
                return next(err); // Handle login errors
            }
            req.session.user = req.user;
            res.redirect(`/pg/owner/dashboard?user=${user.id}`);
            // return res.status(200).json({ message: 'Login successful', user: user }); // Send success response
        });
    })(req, res, next);
});


passport.use('local-students' ,new Strategy({
    usernameField: 'email', // Specify email field as username
    passwordField: 'password' // (This is optional since 'password' is the default)
}, async (email, password, cb) => {
    console.log(email, password);
    try {
        // Select user data from the database by email
        const result = await db.query("SELECT * FROM students WHERE email = $1", [email]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const storedHashedPassword = user.password;
            // Compare hashed password with the provided password
            const isMatch = await bcrypt.compare(password, storedHashedPassword);
            if (isMatch) {
                return cb(null, user); // Successful authentication
            } else {
                return cb(null, false, { message: 'Incorrect password' }); // Incorrect password
            }
        } else {
            return cb(null, false, { message: 'User not found' }); // No user found
        }
    } catch (err) {
        return cb(err); // Handle error
    }
}));


passport.use('local-owner'  ,new Strategy({
    usernameField: 'email', // Specify email field as username
    passwordField: 'password' // (This is optional since 'password' is the default)
}, async (email, password, cb) => {
    console.log(email, password);
    try {
        // Select user data from the database by email
        const result = await db.query("SELECT * FROM owners WHERE email = $1", [email]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const storedHashedPassword = user.password;
            // Compare hashed password with the provided password
            const isMatch = await bcrypt.compare(password, storedHashedPassword);
            if (isMatch) {
                return cb(null, user); // Successful authentication
            } else {
                return cb(null, false, { message: 'Incorrect password' }); // Incorrect password
            }
        } else {
            return cb(null, false, { message: 'User not found' }); // No user found
        }
    } catch (err) {
        return cb(err); // Handle error
    }
}));


passport.serializeUser((user,cb)=>{
    cb(null,user);
  });
  
  passport.deserializeUser((user,cb)=>{
    cb(null,user);
  });


export default router;