const mongoose = require('mongoose');
const Review = require('./review')
const Schema = mongoose.Schema;


// https://res.cloudinary.com/douqbebwk/image/upload/w_300/v1600113904/YelpCamp/gxgle1ovzd2f3dgcpass.png

const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function () { //create a virtual variable called thumbnail
    return this.url.replace('/upload', '/upload/w_200'); //in url of request add width of uploaded picture = 200 px
});

const opts = { toJSON: { virtuals: true } } //it allows virtuals to be a part of result object in DevTools

const CampgroundSchema = new Schema({
    title: String,
    images: [ImageSchema], 
    geometry: {
        type: {
            type: String,
            enum: ['Point'], //it only could be called Point - it's standart
            required: true
        },
        coordinates: {
            type: [Number], //array of Numbers
            required: true
        }
    },
    price: Number,
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId, //type of date is ID object
        ref: 'User' //from User model
    },
    reviews: [
        {
            type: Schema.Types.ObjectId, 
            ref: 'Review'
        }
    ]
}, opts);

//we make a property to nest it at CampgroundSchema and use for maps. Campground title will be shown on the map
CampgroundSchema.virtual('properties.popUpMarkup').get(function () { //afret we can call "campground.popUpMarkUp"
    return `
    <strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
    <p>${this.description.substring(0, 20)}...</p>`
});

CampgroundSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model('Campground', CampgroundSchema); //it creates model called campgrounds in DB and will have Schema ac. to CampgroundSchema