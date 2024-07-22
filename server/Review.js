const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    name: String,
    photo: String,
    reviewtext: String,
    stars: Number,
    time: String,
    yelp: Boolean,
});

const Review = mongoose.model("Review", reviewSchema, "reviews");

module.exports = Review;
