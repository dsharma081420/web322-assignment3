const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { requireLogin } = require('../middleware/auth');


router.get("/register", (req, res) => {
    res.render("register", {
        title: "Register"
    });
});


router.post("/register", async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    let errors = [];


    if (!username || !email || !password || !confirmPassword) {
        errors.push("All fields are required.");
    }

    if (password !== confirmPassword) {
        errors.push("Passwords do not match.");
    }

    if (password.length < 6) {
        errors.push("Password must be at least 6 characters.");
    }

    if (errors.length > 0) {
        return res.render("register", {
            errors,
            username,
            email
        });
    }

    try {
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render("register", {
                errors: ["Email already exists."],
                username,
                email
            });
        }

        const existingName = await User.findOne({ username });
        if (existingName) {
            return res.render("register", {
                errors: ["Username already taken."],
                username,
                email
            });
        }

       
        const hashedPassword = await bcrypt.hash(password, 10);

       
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();

        return res.redirect("/login");

    } catch (err) {
        console.error("Registration error:", err);
        return res.render("register", {
            errors: ["Something went wrong. Try again."],
            username,
            email
        });
    }
});

// --------------------
// GET: Login Page
// --------------------
router.get("/login", (req, res) => {
    res.render("login", {
        title: "Login"
    });
});

// --------------------
// POST: Login User
// --------------------
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    let errors = [];

    if (!email || !password) {
        errors.push("All fields are required.");
        return res.render("login", { errors });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.render("login", {
                errors: ["Invalid email or password."]
            });
        }

        // Compare hashed password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render("login", {
                errors: ["Invalid email or password."]
            });
        }

        // Save session
        req.session.user = {
            id: user._id.toString(),
            username: user.username,
            email: user.email
        };

        return res.redirect("/dashboard");

    } catch (err) {
        console.error("Login error:", err);
        return res.render("login", {
            errors: ["Something went wrong. Try again."]
        });
    }
});

// --------------------
// LOGOUT
// --------------------
router.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/login");
});

module.exports = router;
