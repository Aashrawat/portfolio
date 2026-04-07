const mealkitModel = require("../models/mealkitModel");

// FUNCTIONS

async function getAllMealKits() {
    try {
        return await mealkitModel.find().sort({ title: 1 });
    } catch (error) {
        console.error("Error fetching meal kits:", error);
        return [];
    }
}

async function getFeaturedMealKits() {
    try {
        return await mealkitModel.find({ featuredMealKit: true }).sort({ title: 1 });
    } catch (error) {
        console.error("Error fetching featured meal kits:", error);
        return [];
    }
}

async function getMealKitsByCategory() {
    try {
        const allMealKits = await getAllMealKits();
        const categories = [];

        allMealKits.forEach(meal => {
            let category = categories.find(cat =>
                cat.categoryName === meal.category
            );

            if (!category) {
                category = {
                    categoryName: meal.category,
                    mealKits: []
                };

                categories.push(category);
            }

            category.mealKits.push(meal);
        });

        return categories;
    } catch (error) {
        console.error("Error fetching meal kits by category:", error);
        return [];
    }
}

async function getMealKitById(id) {
    try {
        return await mealkitModel.findById(id);
    } catch (error) {
        console.error("Error fetching meal kit by ID:", error);
        return null;
    }
}

async function createMealKit(mealKitData) {
    try {
        const newMealKit = new mealkitModel(mealKitData);
        return await newMealKit.save();
    } catch (error) {
        console.error("Error creating meal kit:", error);
        throw error;
    }
}

async function updateMealKit(id, mealKitData) {
    try {
        return await mealkitModel.findByIdAndUpdate(id, mealKitData, { new: true });
    } catch (error) {
        console.error("Error updating meal kit:", error);
        throw error;
    }
}

async function deleteMealKit(id) {
    try {
        return await mealkitModel.findByIdAndDelete(id);
    } catch (error) {
        console.error("Error deleting meal kit:", error);
        throw error;
    }
}


module.exports = {

    getAllMealKits,
    getFeaturedMealKits,
    getMealKitsByCategory,
    getMealKitById,
    createMealKit,
    updateMealKit,
    deleteMealKit

};