const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    body: String,
    rating: Number,
    author: {
        type: Schema.Types.ObjectId, //type of data is Object ID
        ref: 'User' //from User model
    }
});

module.exports = mongoose.model("Review", reviewSchema); //it creates model called reviews in DB and will have Schema ac. to reviewSchema

