// if (process.env.NODE_ENV !== "production") { //
//     require('dotenv').config(); // connecting dotenv package for development environment 
// }
require('dotenv').config(); //to have access to environment variables

/* PACKAGES: */
const express = require('express'); //соnnecting of package; framework for Node.js with bunch of functions
const path = require('path'); //соnnecting of package working with routes of files
const mongoose = require('mongoose'); //map documents coming from db into JS objects
const ejsMate = require('ejs-mate'); //adding layouts, partial and block template functions for the EJS template engine
const session = require('express-session'); //server-side datastore to make HTTP stateful and send cookies back to client
const flash = require('connect-flash'); //a special area of the session used for storing messages
const methodOverride = require('method-override'); //to use HTTP verbs such as PUT or DELETE
const passport = require('passport'); //authentication package
const LocalStrategy = require('passport-local'); //Passport strategy for authenticating with a username and password.
const mongoSanitize = require('express-mongo-sanitize'); //to prevent sql injection
const helmet = require('helmet'); //extra protections for Express App by using Headers

/* MODELS: */
const User = require('./models/user'); //connecting of model
const ExpressError = require('./utils/ExpressError'); //connecting Error Class

/* SEPARATE GROUPS of ROUTES: */
const userRoutes = require('./routes/users'); 
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');

const MongoStore = require("connect-mongo")(session);
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'; /* process.env.DB_URL is variable that allows us to connect to Atlas DB via URL
In that URL in .env we put our password from Mongo Atlas to be identified. 'mongodb:...' connects us to default port of MongoDb with name of our app*/
mongoose.connect(dbUrl, { 
    useNewUrlParser: true,
    useCreateIndex: true, 
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection; 
db.on("error", console.error.bind(console, "connection error:")); //logic for error connection
db.once("open", () => { //logic for successful connection
    console.log("Database connected");
});

const app = express(); //start initialization

app.engine('ejs', ejsMate) //tell out app to use ejsMate as an engine
app.set('view engine', 'ejs'); //setting
app.set('views', path.join(__dirname, 'views')) // __dirname is used to point to the public directory that contains static files 
/* MIDDLEWARES: */
app.use(express.urlencoded({ extended: true }));  //parsing req.body
app.use(methodOverride('_method')); //to able to use query ?_method=" to do PUT, DELETE request from POST 
app.use(express.static(path.join(__dirname, 'public')))
app.use(mongoSanitize({ //if there are any forbidden symbols in query
    replaceWith: '_' //it will be replaced with _
}));

const secret = process.env.SECRET || 'thisshouldbeabettersecret!'

const store = new MongoStore({
    url: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
})

const sessionConfig = { //for Authentication
    name: 'blah',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: { //
        httpOnly: true, //for extra security, it doesn't allow an user to enter from client-side to cookie
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //after a week an user won't have access
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
/* MIDDLEWARES: */
app.use(session(sessionConfig)) 
app.use(flash()); 
app.use(helmet({crossOriginEmbedderPolicy: false}));

/* NOT TO BREAK CODE BY contentSecurityPolicy WE ADD link that we gonna use*/
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/drr1ri7er/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

/* AUTHENTICATION */
app.use(passport.initialize());
app.use(passport.session()); 
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser()); //method to store use to the session
passport.deserializeUser(User.deserializeUser()); //method get an user our of the session

app.use((req, res, next) => {  //means that we can user req.user, req.flash(success, error) in all templates
    // console.log(req.session)
    // console.log(req.query)
    res.locals.currentUser = req.user; //passport has command req.user that allows us to see serialized info about an user
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})


/* ALL REQUEST TO '/path' will send use to ROUTER extra mini-application  */
//it's created to reduce dublication
app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)


app.get('/', (req, res) => {
    res.render('home')
});


app.all('*', (req, res, next) => { /* Error Handler for all routes that doen't exists */
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => { //Main Error Handler rules
    const { statusCode = 500 } = err; //status by default equals 500
    if (!err.message) err.message = 'Oh No, Something Went Wrong!' 
    res.status(statusCode).render('error', { err }) //send back status of existing error and send stack of error to rendered file
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`)
})



