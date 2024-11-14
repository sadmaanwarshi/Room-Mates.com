import express, { Router } from "express"
import pg from "pg";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import passport from "passport";
import { Strategy } from "passport-local"; 


const router = express.Router();

const db = new pg.Client(
    {
        user: "postgres",
        host: "localhost",
        database:"paying-guest-db",
        password: "Sad@7562",
        port: 5432
    }
)

db.connect();

// Render Student Login Page
router.get('/page/login/student', (req, res) => {
    res.render('student/login', {message:null});
});

// Render Student Registration Page
router.get('/page/register/student', (req, res) => {
    res.render('student/register' , {message:null});
});

// Render Owner Login Page
router.get('/page/login/owner', (req, res) => {
    res.render('owner/login' , {message:null});
});

// Render Owner Registration Page
router.get('/page/register/owner', (req, res) => {
    res.render('owner/register', );
});


router.post('/register/student', [
    body('firstName', 'Enter a valid name').isLength({ min: 3 }), // check name should not less than 3 character
    body('email', 'Enter a valid email').isEmail(), // should valid email
    body('password', 'Password must be at least 5 characters').isLength({ min: 5 }),
], async (req, res) => {

    const {firstName, lastName, email, password, phoneNumber, university, program, yearOfStudy, address, city, state, pincode, dob} = req.body
    console.log(req.body)
    const errors = validationResult(req); // is any error in validator name, email or password
    if (!errors.isEmpty()) { // if error found
        console.log(errors.array()); // Log errors to see what's wrong
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        // Check whether the user with this email exists already
        const result = await db.query("SELECT * FROM students WHERE email = $1", [email]);
        if (result.rows.length > 0) {
            return res.status(400).json({ error: "Sorry, a user with this email already exists." });
        }

        //All set to go
        //salting and hashing
        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(password, salt);

        // Now Create a new user
        await db.query(
            "INSERT INTO students (firstname, lastname, email, password, phonenumber, university, program, yearofstudy, address, city, state, pincode, dob) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)",
            [firstName, lastName, email, secPass, phoneNumber, university, program, yearOfStudy, address, city, state, pincode, dob]
          );
          
        // return res.status(201).json({ message: "User created successfully." }); // Indicate success
        res.render('student/login', {message : "Registration Succesfully"})
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/register/owner', [
    body('ownerName', 'Enter a valid name').isLength({ min: 3 }), // check name should not less than 3 character
    body('email', 'Enter a valid email').isEmail(), // should valid email
    body('password', 'Password must be at least 5 characters').isLength({ min: 5 }),
], async (req, res) => {

    const {
        businessName,
        ownerName,
        email,
        password,
        phoneNumber,
        licenseNumber,
        address,
        city,
        state,
        pincode,
        propertyName,
        businessDescription,
        terms
      } = req.body;

    const errors = validationResult(req); // is any error in validator name, email or password
    if (!errors.isEmpty()) { // if error found
        console.log(errors.array()); // Log errors to see what's wrong
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        console.log(req.body)
        // Check whether the user with this email exists already
        const result = await db.query("SELECT * FROM owners WHERE email = $1", [email]);
        if (result.rows.length > 0) {
            return res.status(400).json({ error: "Sorry, a user with this email already exists." });
            
        }

        //salting and hashing
        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(password, salt);

      // Create a new user
      await db.query(
      "INSERT INTO owners (business_name, owner_name, email, password, phone_number, license_number, address, city, state, pincode, property_name, business_description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
      [
        businessName,
        ownerName,
        email,
        secPass,
        phoneNumber,
        licenseNumber || null, // Use null if the license number is empty
        address,
        city,
        state,
        pincode,
        propertyName,
        businessDescription || null // Use null if the description is empty
      ]
    );
        // return res.status(201).json({ message: "User created successfully." }); // Indicate success
        res.render('owner/login')
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

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
            req.session.user = req.user;
             res.render('student/dashboard',{ user: user, message:"Hello" , error:err, listings: []})
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