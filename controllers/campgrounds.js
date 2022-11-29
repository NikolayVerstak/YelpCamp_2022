/* CONTROLLERS KEEPS ALL FUNCTIONALITY*/

const Campground = require('../models/campground');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding"); //connect to map
const mapBoxToken = process.env.MAPBOX_TOKEN; //require from env-file MAPBOX_TOKEN const
const geocoder = mbxGeocoding({ accessToken: mapBoxToken }); //when we initialise we add previous TOKEN
const { cloudinary } = require("../cloudinary"); //cloud storage


module.exports.index = async (req, res) => { //render to the Page with all Camps
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds })
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
}

module.exports.createCampground = async (req, res, next) => { 
    const geoData = await geocoder.forwardGeocode({ //define geometry to show location on the map
        query: req.body.campground.location, //latitude and longitude of location that user adds
        limit: 1 //only one point 
    }).send()
    const campground = new Campground(req.body.campground); 
    campground.geometry = geoData.body.features[0].geometry; //save geometry to campground schema; features is am array and we need only on thing so [0]
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename })); //save URL and Name that comes from Cloudinary
    campground.author = req.user._id;
    await campground.save();
    console.log(campground);
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.showCampground = async (req, res,) => {
    const campground = await Campground.findById(req.params.id).populate({ //it's nested populate because we gonna show author of review
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author'); //this's author of campground
    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground });
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id)
    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground });
}

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    console.log(req.body);
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.images.push(...imgs);
    await campground.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', 'Successfully updated campground!');
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground')
    res.redirect('/campgrounds');
}