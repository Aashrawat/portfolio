const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const FormData = require("form-data");
const Mailgun = require("mailgun.js");

const mailgun = new Mailgun(FormData);

const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY
});

const mealKitUtil = require("../modules/mealkit-util");
const userModel = require("../models/userModel");
const { validateRegistration, validateLogin } = require("../modules/validation-util");


// authorization helpers
function ensureCustomer(req, res, next) {
    if (!req.session.user) {
        return res.status(401).render("general/error", {
            statusCode: 401,
            message: "You are not authorized to view this page"
        });
    }

    if (req.session.user.role !== "customer") {
        return res.status(401).render("general/error", {
            statusCode: 401,
            message: "You are not authorized to view this page"
        });
    }

    next();
}

// HOME
router.get("/", async (req, res) => {
    try {
        const featured = await mealKitUtil.getFeaturedMealKits();

        res.render("general/home", {
            featuredMealKits: featured
        });
    } catch (error) {
        console.error("Error loading home page:", error);
        res.status(500).render("general/error", {
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
});

// SIGN-UP PAGE
router.get("/sign-up", (req, res) => {
    res.render("general/sign-up", {
        errors: {},
        values: {}
    });
});

// SIGN-UP SUBMIT
router.post("/sign-up", async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    const values = { firstName, lastName, email, password };
    const errors = validateRegistration(values);

    if (Object.keys(errors).length > 0) {
        return res.render("general/sign-up", {
            errors,
            values
        });
    }

    try {
        const existingUser = await userModel.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            return res.render("general/sign-up", {
                errors: { email: "This email is already registered." },
                values
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await userModel.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: "customer"
        });

        console.log("User saved:", newUser.email);

        
        try {
            console.log("Sending email...");
            console.log("EMAIL:", email);

            const data = await mg.messages.create(
                "sandboxa3bda6f4bd5c4947bb0e5b60e72e11b1.mailgun.org",
                {
                    from: `Mailgun Sandbox <postmaster@sandboxa3bda6f4bd5c4947bb0e5b60e72e11b1.mailgun.org>`,
                    to: [email], 
                    subject: "Welcome to DIY Hotpot!",
                    html: `
                        <h2>Hello ${firstName} ${lastName},</h2>
                        <p>Welcome to <b>DIY Hotpot</b></p>
                        <p>Your pot, your way!</p>
                    `
                }
            );

            console.log(" Email sent!");
            console.log(data);

        } catch (err) {
            console.log("Mailgun Error:", err.message);
        }

      
        res.redirect("/welcome");

    } catch (error) {
        console.log("Signup Error:", error);
        res.status(500).render("general/error", {
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
});

// LOGIN PAGE
router.get("/log-in", (req, res) => {
    res.render("general/log-in", {
        errors: {},
        values: { role: "customer" }
    });
});

// LOGIN SUBMIT
router.post("/log-in", async (req, res) => {
    const { email, password, role } = req.body;

    const values = { email, password, role };
    const errors = validateLogin(values);

    if (Object.keys(errors).length > 0) {
        return res.render("general/log-in", {
            errors,
            values
        });
    }

    try {
        const user = await userModel.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.render("general/log-in", {
                errors: { general: "Sorry, you entered an invalid email and/or password." },
                values
            });
        }

        const matched = await bcrypt.compare(password, user.password);

        if (!matched) {
            return res.render("general/log-in", {
                errors: { general: "Sorry, you entered an invalid email and/or password." },
                values
            });
        }

        if (role === "customer" && user.role !== "customer") {
            return res.render("general/log-in", {
                errors: { general: "Sorry, you entered an invalid email and/or password." },
                values
            });
        }

        if (role === "clerk" && user.role !== "clerk") {
            return res.render("general/log-in", {
                errors: { general: "Sorry, you entered an invalid email and/or password." },
                values
            });
        }

        req.session.user = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
        };

        if (user.role === "clerk") {
            return res.redirect("/mealkits/list");
        }

        res.redirect("/cart");
    } catch (error) {
        res.status(500).render("general/error", {
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
});

// WELCOME
router.get("/welcome", (req, res) => {
    res.render("general/welcome");
});

// CART
 
router.get("/cart", ensureCustomer, async (req, res) => {
    try {
        let cart = req.session.cart || [];
        console.log("Cart display - session cart:", cart);
        let cartItems = [];

        // Get meal kit details for cart items
        for (let item of cart) {
            console.log("Processing cart item:", item);
            const mealKit = await mealKitUtil.getMealKitById(item.mealKitId);
            console.log("Meal kit lookup result:", mealKit ? mealKit.title : "NOT FOUND");
            if (mealKit) {
                cartItems.push({
                    ...mealKit.toObject(),
                    quantity: item.quantity,
                    lineTotal: mealKit.price * item.quantity
                });
            }
        }

        console.log("Final cart items:", cartItems.length);

        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
        const tax = subtotal * 0.10;
        const grandTotal = subtotal + tax;

        res.render("general/cart", {
            cartItems,
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            grandTotal: grandTotal.toFixed(2)
        });
    } catch (error) {
        console.error("Error loading cart:", error);
        res.status(500).render("general/error", {
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
});

// Add to cart
router.post("/cart/add", ensureCustomer, async (req, res) => {
    try {
        const { mealKitId } = req.body;
        console.log("Cart add request - mealKitId:", mealKitId);
        console.log("Session user:", req.session.user);

        if (!mealKitId) {
            console.log("No mealKitId provided");
            return res.status(400).render("general/error", {
                statusCode: 400,
                message: "Invalid meal kit ID"
            });
        }

        // Verify meal kit exists
        const mealKit = await mealKitUtil.getMealKitById(mealKitId);
        console.log("Meal kit found:", mealKit ? mealKit.title : "NOT FOUND");
        if (!mealKit) {
            return res.status(404).render("general/error", {
                statusCode: 404,
                message: "Meal kit not found"
            });
        }

        // Initialize cart if it doesn't exist
        if (!req.session.cart) {
            req.session.cart = [];
            console.log("Initialized new cart");
        }

        // Check if item already in cart
        const existingItem = req.session.cart.find(item => item.mealKitId === mealKitId);
        console.log("Existing item in cart:", existingItem);

        if (existingItem) {
            existingItem.quantity += 1;
            console.log("Increased quantity to:", existingItem.quantity);
        } else {
            req.session.cart.push({
                mealKitId,
                quantity: 1
            });
            console.log("Added new item to cart");
        }

        console.log("Cart contents:", req.session.cart);
        res.redirect("/cart");
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).render("general/error", {
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
});

// Update cart item quantity
router.post("/cart/update", ensureCustomer, (req, res) => {
    try {
        const { mealKitId, quantity } = req.body;
        const qty = parseInt(quantity);

        if (!req.session.cart || !mealKitId || isNaN(qty) || qty < 0) {
            return res.status(400).render("general/error", {
                statusCode: 400,
                message: "Invalid request"
            });
        }

        const itemIndex = req.session.cart.findIndex(item => item.mealKitId === mealKitId);

        if (itemIndex === -1) {
            return res.status(404).render("general/error", {
                statusCode: 404,
                message: "Item not found in cart"
            });
        }

        if (qty === 0) {
            // Remove item from cart
            req.session.cart.splice(itemIndex, 1);
        } else {
            req.session.cart[itemIndex].quantity = qty;
        }

        res.redirect("/cart");
    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).render("general/error", {
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
});

// Remove from cart
router.post("/cart/remove", ensureCustomer, (req, res) => {
    try {
        const { mealKitId } = req.body;

        if (!req.session.cart || !mealKitId) {
            return res.status(400).render("general/error", {
                statusCode: 400,
                message: "Invalid request"
            });
        }

        req.session.cart = req.session.cart.filter(item => item.mealKitId !== mealKitId);

        res.redirect("/cart");
    } catch (error) {
        console.error("Error removing from cart:", error);
        res.status(500).render("general/error", {
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
});

// Place order
router.post("/cart/checkout", ensureCustomer, async (req, res) => {
    try {
        if (!req.session.cart || req.session.cart.length === 0) {
            return res.status(400).render("general/error", {
                statusCode: 400,
                message: "Your cart is empty"
            });
        }

        let cartItems = [];
        let orderDetails = [];

        // Get meal kit details and prepare order
        for (let item of req.session.cart) {
            const mealKit = await mealKitUtil.getMealKitById(item.mealKitId);
            if (mealKit) {
                const lineTotal = mealKit.price * item.quantity;
                cartItems.push({
                    ...mealKit.toObject(),
                    quantity: item.quantity,
                    lineTotal
                });
                orderDetails.push(`${mealKit.title} (${item.quantity}x) - $${lineTotal.toFixed(2)}`);
            }
        }

        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
        const tax = subtotal * 0.10;
        const grandTotal = subtotal + tax;

        // Prepare email content
        const emailContent = `
Dear ${req.session.user.firstName} ${req.session.user.lastName},

Thank you for your order! Here are the details:

${orderDetails.join('\n')}

Subtotal: $${subtotal.toFixed(2)}
Tax (10%): $${tax.toFixed(2)}
Grand Total: $${grandTotal.toFixed(2)}

Your order has been processed successfully.

Best regards,
DIY Hotpot Team
        `;

        // Send email
        try {
            await mg.messages.create(
                "sandboxa3bda6f4bd5c4947bb0e5b60e72e11b1.mailgun.org",
                {
                    from: `Mailgun Sandbox <postmaster@sandboxa3bda6f4bd5c4947bb0e5b60e72e11b1.mailgun.org>`,
                    to: [req.session.user.email],
                    subject: "DIY Hotpot Order Confirmation",
                    text: emailContent
                }
            );
            console.log("Order confirmation email sent!");
        } catch (emailError) {
            console.error("Error sending email:", emailError);
            // Continue with checkout even if email fails
        }

        // Clear the cart
        req.session.cart = [];

        res.render("general/order-confirmation", {
            message: "Your order has been placed successfully! A confirmation email has been sent."
        });

    } catch (error) {
        console.error("Error during checkout:", error);
        res.status(500).render("general/error", {
            statusCode: 500,
            message: "Internal Server Error"
        });
    }
});

// LOGOUT
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/log-in");
    });
});

module.exports = router;
