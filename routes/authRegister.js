import express, { Router } from "express"
import pg from "pg";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
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

router.get('/page/register/student', (req, res) => {
    res.render('student/register' , {message:null});
});


router.get('/page/register/owner', (req, res) => {
    res.render('owner/register', );
});

router.post('/register/student', [
    body('firstName', 'Enter a valid name').isLength({ min: 3 }), // check name should not less than 3 character
    body('email', 'Enter a valid email').isEmail(), // should valid email
    body('password', 'Password must be at least 5 characters').isLength({ min: 5 }),
], async (req, res) => {

    const {firstName, lastName, email, password, phoneNumber} = req.body
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
            "INSERT INTO students (firstname, lastname, email, password, phonenumber) VALUES ($1, $2, $3, $4, $5)",
            [firstName, lastName, email, secPass, phoneNumber]
          );
          
        // return res.status(201).json({ message: "User created successfully." }); // Indicate success
        res.render('student/login', {message : "Registration Succesfully Login With your Credentials.."})
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
      "INSERT INTO owners (owner_name, email, password, phone_number, license_number, address, city, state, pincode, property_name, business_description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
      [
       
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
        res.render('owner/login',{message : "Registration Succesfully"} );
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

export default router;