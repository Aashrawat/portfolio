const express = require("express");
const router = express.Router();
const mealKitUtil = require("../modules/mealkit-util");
const path = require("path");
const fs = require("fs");

function ensureClerk(req, res, next) {
    if (!req.session.user) {
        return res.status(401).render("general/error", {
            statusCode: 401,
            message: "You are not authorized to view this page"
        });
    }

    if (req.session.user.role !== "clerk") {
        return res.status(401).render("general/error", {
            statusCode: 401,
            message: "You are not authorized to view this page"
        });
    }

    next();
}

// replaces /on-the-menu
router.get("/", async (req, res) => {
    try {
        const categories = await mealKitUtil.getMealKitsByCategory();

        res.render("mealkits/on-the-menu", {
            categories
        });
    } catch (error) {
        console.error("Error loading meal kits page:", error);
        res.status(500).render("general/error", {
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
});

// clerk list page
router.get("/list", ensureClerk, async (req, res) => {
    try {
        const allMealKits = await mealKitUtil.getAllMealKits();

        res.render("mealkits/list", {
            mealKits: allMealKits
        });
    } catch (error) {
        console.error("Error loading meal kits list:", error);
        res.status(500).render("general/error", {
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
});

// Add meal kit - GET
router.get("/add", ensureClerk, (req, res) => {
    res.render("mealkits/add", {
        errors: {},
        values: {}
    });
});

// Add meal kit - POST
router.post("/add", ensureClerk, async (req, res) => {
    try {
        const { title, includes, description, category, price, cookingTime, servings, featuredMealKit } = req.body;

        // Validation
        const errors = {};
        const values = { title, includes, description, category, price, cookingTime, servings, featuredMealKit };

        if (!title || title.trim() === "") {
            errors.title = "Title is required.";
        }

        if (!includes || includes.trim() === "") {
            errors.includes = "Includes is required.";
        }

        if (!description || description.trim() === "") {
            errors.description = "Description is required.";
        }

        if (!category || category.trim() === "") {
            errors.category = "Category is required.";
        }

        const priceNum = parseFloat(price);
        if (!price || isNaN(priceNum) || priceNum <= 0) {
            errors.price = "Price must be a number greater than 0.";
        }

        const cookingTimeNum = parseInt(cookingTime);
        if (!cookingTime || isNaN(cookingTimeNum) || cookingTimeNum < 1) {
            errors.cookingTime = "Cooking time must be a number greater than 0.";
        }

        const servingsNum = parseInt(servings);
        if (!servings || isNaN(servingsNum) || servingsNum < 1) {
            errors.servings = "Servings must be a number greater than 0.";
        }

        // File upload validation
        if (!req.files || !req.files.imageUrl) {
            errors.imageUrl = "Image is required.";
        } else {
            const imageFile = req.files.imageUrl;
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
            const fileExtension = path.extname(imageFile.name).toLowerCase();

            if (!allowedExtensions.includes(fileExtension)) {
                errors.imageUrl = "Only JPG, JPEG, PNG, and GIF files are allowed.";
            }
        }

        if (Object.keys(errors).length > 0) {
            return res.render("mealkits/add", {
                errors,
                values
            });
        }

        // Handle file upload
        const imageFile = req.files.imageUrl;
        const fileName = Date.now() + path.extname(imageFile.name);
        const uploadPath = path.join(__dirname, "../public/images", fileName);

        await imageFile.mv(uploadPath);

        // Create meal kit
        const mealKitData = {
            title: title.trim(),
            includes: includes.trim(),
            description: description.trim(),
            category: category.trim(),
            price: priceNum,
            cookingTime: cookingTimeNum,
            servings: servingsNum,
            imageUrl: `/images/${fileName}`,
            featuredMealKit: featuredMealKit === "on"
        };

        await mealKitUtil.createMealKit(mealKitData);

        res.redirect("/mealkits/list");

    } catch (error) {
        console.error("Error adding meal kit:", error);
        res.status(500).render("general/error", {
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
});

// Edit meal kit - GET
router.get("/edit/:id", ensureClerk, async (req, res) => {
    try {
        const mealKit = await mealKitUtil.getMealKitById(req.params.id);

        if (!mealKit) {
            return res.status(404).render("general/error", {
                statusCode: 404,
                message: "Meal kit not found"
            });
        }

        res.render("mealkits/edit", {
            errors: {},
            values: {
                _id: mealKit._id,
                title: mealKit.title,
                includes: mealKit.includes,
                description: mealKit.description,
                category: mealKit.category,
                price: mealKit.price,
                cookingTime: mealKit.cookingTime,
                servings: mealKit.servings,
                featuredMealKit: mealKit.featuredMealKit
            }
        });
    } catch (error) {
        console.error("Error loading edit page:", error);
        res.status(500).render("general/error", {
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
});

// Edit meal kit - POST
router.post("/edit/:id", ensureClerk, async (req, res) => {
    try {
        const { title, includes, description, category, price, cookingTime, servings, featuredMealKit } = req.body;

        // Validation
        const errors = {};
        const values = { _id: req.params.id, title, includes, description, category, price, cookingTime, servings, featuredMealKit };

        if (!title || title.trim() === "") {
            errors.title = "Title is required.";
        }

        if (!includes || includes.trim() === "") {
            errors.includes = "Includes is required.";
        }

        if (!description || description.trim() === "") {
            errors.description = "Description is required.";
        }

        if (!category || category.trim() === "") {
            errors.category = "Category is required.";
        }

        const priceNum = parseFloat(price);
        if (!price || isNaN(priceNum) || priceNum <= 0) {
            errors.price = "Price must be a number greater than 0.";
        }

        const cookingTimeNum = parseInt(cookingTime);
        if (!cookingTime || isNaN(cookingTimeNum) || cookingTimeNum < 1) {
            errors.cookingTime = "Cooking time must be a number greater than 0.";
        }

        const servingsNum = parseInt(servings);
        if (!servings || isNaN(servingsNum) || servingsNum < 1) {
            errors.servings = "Servings must be a number greater than 0.";
        }

        // File upload validation (optional for edit)
        let imageUrl;
        if (req.files && req.files.imageUrl) {
            const imageFile = req.files.imageUrl;
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
            const fileExtension = path.extname(imageFile.name).toLowerCase();

            if (!allowedExtensions.includes(fileExtension)) {
                errors.imageUrl = "Only JPG, JPEG, PNG, and GIF files are allowed.";
            } else {
                // Upload new image
                const fileName = Date.now() + path.extname(imageFile.name);
                const uploadPath = path.join(__dirname, "../public/images", fileName);
                await imageFile.mv(uploadPath);
                imageUrl = `/images/${fileName}`;
            }
        }

        if (Object.keys(errors).length > 0) {
            return res.render("mealkits/edit", {
                errors,
                values
            });
        }

        // Get existing meal kit
        const existingMealKit = await mealKitUtil.getMealKitById(req.params.id);
        if (!existingMealKit) {
            return res.status(404).render("general/error", {
                statusCode: 404,
                message: "Meal kit not found"
            });
        }

        // Update meal kit
        const mealKitData = {
            title: title.trim(),
            includes: includes.trim(),
            description: description.trim(),
            category: category.trim(),
            price: priceNum,
            cookingTime: cookingTimeNum,
            servings: servingsNum,
            featuredMealKit: featuredMealKit === "on"
        };

        if (imageUrl) {
            mealKitData.imageUrl = imageUrl;
            // Delete old image file if it exists and is not a default image
            if (existingMealKit.imageUrl && existingMealKit.imageUrl.startsWith('/images/')) {
                const oldImagePath = path.join(__dirname, "../public", existingMealKit.imageUrl);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        } else {
            mealKitData.imageUrl = existingMealKit.imageUrl;
        }

        await mealKitUtil.updateMealKit(req.params.id, mealKitData);

        res.redirect("/mealkits/list");

    } catch (error) {
        console.error("Error editing meal kit:", error);
        res.status(500).render("general/error", {
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
});

// Remove meal kit - GET (confirmation page)
router.get("/remove/:id", ensureClerk, async (req, res) => {
    try {
        const mealKit = await mealKitUtil.getMealKitById(req.params.id);

        if (!mealKit) {
            return res.status(404).render("general/error", {
                statusCode: 404,
                message: "Meal kit not found"
            });
        }

        res.render("mealkits/remove", {
            mealKit
        });
    } catch (error) {
        console.error("Error loading remove page:", error);
        res.status(500).render("general/error", {
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
});

// Remove meal kit - POST
router.post("/remove/:id", ensureClerk, async (req, res) => {
    try {
        const mealKit = await mealKitUtil.getMealKitById(req.params.id);

        if (!mealKit) {
            return res.status(404).render("general/error", {
                statusCode: 404,
                message: "Meal kit not found"
            });
        }

        // Delete image file if it exists
        if (mealKit.imageUrl && mealKit.imageUrl.startsWith('/images/')) {
            const imagePath = path.join(__dirname, "../public", mealKit.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await mealKitUtil.deleteMealKit(req.params.id);

        res.redirect("/mealkits/list");

    } catch (error) {
        console.error("Error removing meal kit:", error);
        res.status(500).render("general/error", {
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
});

module.exports = router;
