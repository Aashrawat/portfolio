/*********************************************************************************
* WEB322 – Assignment 2
* Name: Aashrawat Shrestha
* Email: ashrestha73@myseneca.ca
* Course: WEB322 NCC
*********************************************************************************/

const dotenv = require("dotenv");
dotenv.config({ path: "./config/.env" });

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");

const generalController = require("./controllers/generalController");
const mealkitController = require("./controllers/mealkitController");
const loadDataController = require("./controllers/loadDataController");

const app = express();
const PORT = 8080;

// MongoDB
mongoose.connect(process.env.MONGO_CONNECTION_STRING)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log("MongoDB connection error:", err));

// middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressLayouts);
app.use(fileUpload());

app.use(session({
    secret: process.env.SESSION_SECRET || "mySecretKey",
    resave: false,
    saveUninitialized: false
}));

// make session data available in all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/main");

// controllers
app.use("/", generalController);
app.use("/mealkits", mealkitController);
app.use("/load-data", loadDataController);

// 404
app.use((req, res) => {
    res.status(404).render("general/error", {
        statusCode: 404,
        message: "Page not found"
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
