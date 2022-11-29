const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});

UserSchema.plugin(passportLocalMongoose); //it will add username and password to Schema and provide hashing algorithm

module.exports = mongoose.model('User', UserSchema); //it creates model called users in DB and will have Schema ac. to UserSchema