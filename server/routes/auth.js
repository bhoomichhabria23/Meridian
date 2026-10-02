const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();

/* =========================================================
   REGISTER
========================================================= */

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      phone,
      role,
      specialization,
      email,
      password,
    } = req.body;

    if (!name || !phone || !role || !email || !password) {
      return res.status(400).json({
        message: "Please fill all required fields.",
      });
    }

    if (!["patient", "doctor", "receptionist"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role.",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      phone: phone.trim(),
      role,
      specialization: role === "doctor"
        ? specialization || ""
        : "",
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Registration successful.",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        specialization: user.specialization,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: "Registration failed. Please try again.",
    });
  }
});


/* =========================================================
   LOGIN
========================================================= */

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
      role,
    } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Please enter email, password and select a role.",
      });
    }

    /* -----------------------------------------
       FIND USER IN MONGODB
    ----------------------------------------- */

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      role,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email, password or role.",
      });
    }

    /* -----------------------------------------
       CHECK PASSWORD
    ----------------------------------------- */

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email, password or role.",
      });
    }

    /* -----------------------------------------
       CREATE JWT
    ----------------------------------------- */

    const token = jwt.sign(
      {
        id: user._id.toString(),
        uid: user.firebaseUid || user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    /* -----------------------------------------
       STORE JWT IN HTTP-ONLY COOKIE

       NOT localStorage
    ----------------------------------------- */

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production"
        ? "none"
        : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    /* -----------------------------------------
       RESPONSE
    ----------------------------------------- */

    return res.status(200).json({
      message: "Login successful.",
      user: {
        id: user._id,
        uid: user.firebaseUid || user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
      },
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
});


/* =========================================================
   GET CURRENT LOGGED-IN USER
========================================================= */

router.get("/me", async (req, res) => {
  try {

    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Not authenticated.",
      });
    }

    /* -----------------------------------------
       VERIFY TOKEN
    ----------------------------------------- */

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    /* -----------------------------------------
       FIND USER IN MONGODB
    ----------------------------------------- */

    const user = await User.findById(decoded.id).select(
      "-password"
    );

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists.",
      });
    }

    return res.status(200).json({
      id: user._id,
      uid: user.firebaseUid || user._id.toString(),
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      specialization: user.specialization,
    });

  } catch (error) {
    console.error("AUTH ME ERROR:", error);

    return res.status(401).json({
      message: "Authentication failed.",
    });
  }
});


/* =========================================================
   LOGOUT
========================================================= */

router.post("/logout", (req, res) => {

  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production"
      ? "none"
      : "lax",
  });

  return res.status(200).json({
    message: "Logout successful.",
  });
});


module.exports = router;