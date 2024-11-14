import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import  passport  from "passport";
import  session  from "express-session";
import methodOverride from 'method-override';
import auth from "./routes/auth.js";
import pgAdd from "./routes/owners dashboard/pgAdd.js"
import filter from "./routes/user/filter.js";
import pgUpdate from "./routes/owners dashboard/pgUpdate.js"
import pgDelete from "./routes/owners dashboard/pgDelete.js"
import pgFetchOwnersPg from "./routes/owners dashboard/pgFetchOwnersPg.js"
import fetchByLocation from "./routes/user/fetchByLocation.js"
import fetchAllpg from "./routes/user/fetchAllPg.js"
import cors from "cors";
import homepage from "./routes/homepage.js";
import viewedMap from "./routes/user/viewedMap.js";
import booking from "./routes/user/booking.js"
import bookingManage from "./routes/owners dashboard/bookingManage.js"
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(bodyParser.json()); // For parsing application/json (optional if you are using express.json())
app.use(methodOverride('_method')); // Allow method override for PUT and DELETE
app.use(cors({ origin: 'http://localhost:3000', credentials: true })); // CORS setup
app.use(express.static('public')); // Serve static files from the 'public' directory

app.use(session({
    secret: 'TOPSECRETT',
    resave: false,
    saveUninitialized: true
  }));

app.use(passport.initialize());
app.use(passport.session());



app.use('/',homepage); //home page (index.ejs)
// User function
app.use('/auth', auth); // http://localhost:3000/auth/login/student
app.use('/pg/user', fetchAllpg);  // http://localhost:3000/pg/user/fetchall
app.use('/pg/user' , fetchByLocation);  // http://localhost:3000/pg/user/search/location
app.use('/pg/user', filter);  // http://localhost:3000/pg/user/fetch/filter?max_price=4000
app.use('/pg/user', booking); 



app.use('/pg/user',viewedMap);
// owners Dashboard
app.use('/pg/owner',pgAdd); // http://localhost:3000/pg/owner/add
app.use('/pg/owner',pgUpdate); // http://localhost:3000/pg/owner/update/:id
app.use('/pg/owner', pgDelete); // http://localhost:3000/pg/owner/delete/:id
app.use('/pg/owner',pgFetchOwnersPg); // http://localhost:3000/pg/owner/dashboard
app.use('/pg/owner',bookingManage);

app.listen(port, ()=>{
    console.log(`server running on port ${port}`)
});