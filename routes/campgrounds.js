const express = require('express');
const router = express.Router(); 
const campgrounds = require('../controllers/campgrounds'); //connecting to models
const catchAsync = require('../utils/catchAsync'); //model that helps to catch errors
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware'); 
const multer = require('multer'); //middleware for handling multipart/form-data, which is primarily used for uploading files
const { storage } = require('../cloudinary'); //it's an object to allows us to store images in cloudinary 
const upload = multer({ storage }); //we upload images to folder that mentioned in storage object

const Campground = require('../models/campground');

router.route('/')
    .get(catchAsync(campgrounds.index)) //get request to /campground and catchAsync model used for campground.index model
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground)) //it search for the form with input name "image"


router.get('/new', isLoggedIn, campgrounds.renderNewForm)

router.route('/:id')
    .get(catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm))



module.exports = router;