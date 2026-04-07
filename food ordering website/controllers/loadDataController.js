const express = require("express");
const router = express.Router();
const mealkitModel = require("../models/mealkitModel");

function ensureClerk(req, res, next) {
    if (!req.session.user) {
        return res.status(403).render("general/error", {
            statusCode: 403,
            message: "You are not authorized to add meal kits"
        });
    }

    if (req.session.user.role !== "clerk") {
        return res.status(403).render("general/error", {
            statusCode: 403,
            message: "You are not authorized to add meal kits"
        });
    }

    next();
}

// Load meal kit data
router.get("/mealkits", ensureClerk, async (req, res) => {
    try {
        // Check if meal kits already exist
        const existingCount = await mealkitModel.countDocuments();

        if (existingCount > 0) {
            return res.render("general/error", {
                statusCode: 200,
                message: "Meal kits have already been added to the database"
            });
        }

        // Sample meal kit data
        const mealKits = [
            {
                title: "Signature Malatang Broth",
                includes: "Sichuan Peppercorn Broth",
                description: "Spicy customizable Chinese hotpot.",
                category: "Classic Meals",
                price: 19.99,
                cookingTime: 10,
                servings: 1,
                imageUrl: "/images/malatang.jpg",
                featuredMealKit: true
            },
            {
                title: "Tom Yum Broth",
                includes: "Seafood",
                description: "Spicy and sour Thai hotpot.",
                category: "Classic Meals",
                price: 20.99,
                cookingTime: 10,
                servings: 1,
                imageUrl: "/images/tom yom.jpg",
                featuredMealKit: true
            },
            {
                title: "Miso Broth",
                includes: "Japanese Miso Broth",
                description: "Rich and savory Japanese miso hotpot.",
                category: "Classic Meals",
                price: 18.99,
                cookingTime: 12,
                servings: 1,
                imageUrl: "/images/miso.jpg",
                featuredMealKit: false
            },
            {
                title: "Sukiyaki Broth",
                includes: "Sweet Soy Broth",
                description: "Traditional Japanese sukiyaki experience.",
                category: "Sweet Soup",
                price: 22.99,
                cookingTime: 7,
                servings: 2,
                imageUrl: "/images/sukiyaki.jpg",
                featuredMealKit: true
            },
            {
                title: "Mushroom Vegan Broth",
                includes: "Mushroom Vegetable Broth",
                description: "Healthy vegan mushroom hotpot.",
                category: "Vegan Meals",
                price: 17.99,
                cookingTime: 10,
                servings: 1,
                imageUrl: "/images/mushroomvegan.jpg",
                featuredMealKit: false
            },
            {
                title: "Tomato Broth",
                includes: "Tomato Seasoning",
                description: "Tangy and comforting tomato hotpot.",
                category: "Vegan Meals",
                price: 17.99,
                cookingTime: 10,
                servings: 1,
                imageUrl: "/images/tomato.png",
                featuredMealKit: false
            }
        ];

        // Insert meal kits into database
        await mealkitModel.insertMany(mealKits);

        res.render("general/error", {
            statusCode: 200,
            message: "Added meal kits to the database"
        });

    } catch (error) {
        console.error("Error loading meal kits:", error);
        res.status(500).render("general/error", {
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
});

module.exports = router;