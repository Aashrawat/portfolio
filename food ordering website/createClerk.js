const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config({path:"./config/.env"});

const userModel = require("./models/userModel");

async function createClerk() {
    try {
        await mongoose.connect(process.env.MONGO_CONNECTION_STRING);

        const hashedPassword = await bcrypt.hash("Clerk123!", 10);

        await userModel.create({
            firstName: "Admin",
            lastName: "Clerk",
            email: "clerk@test.com",
            password: hashedPassword,
            role: "clerk"
        });

        console.log("Clerk created");

        await mongoose.disconnect();
    } catch (err) {
        console.log(err);
    }
}

createClerk();