const mongoose = require("mongoose");

const mealkitSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    includes: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0.01
    },
    cookingTime: {
        type: Number,
        required: true,
        min: 1
    },
    servings: {
        type: Number,
        required: true,
        min: 1
    },
    imageUrl: {
        type: String,
        required: true
    },
    featuredMealKit: {
        type: Boolean,
        default: false
    }
}, {
    collection: "mealkits",
    timestamps: true
});

const mealkitModel = mongoose.model("mealkitModel", mealkitSchema);

module.exports = mealkitModel;